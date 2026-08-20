// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DENTAL & ORAL HEALTH INTELLIGENCE ENGINE
// Monitors how well the home manages children's dental health — check-up
// compliance, oral hygiene routine adherence, dental treatment follow-through,
// orthodontic care management, and dental anxiety support.
// Measures dental check-up compliance, oral hygiene adherence, treatment
// completion, orthodontic compliance, anxiety support, and child engagement.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care), Reg 5 (Quality of care standard).
// SCCIF: "Children's health and well-being are promoted".
// Store keys: dentalCheckupRecords, oralHygieneRecords,
//             dentalTreatmentRecords, orthodonticRecords,
//             dentalAnxietyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DentalCheckupRecordInput {
  id: string;
  child_id: string;
  scheduled_date: string;
  attended: boolean;
  date_attended: string | null;
  dentist_name: string;
  dental_practice: string;
  outcome: "all_clear" | "treatment_needed" | "referral_made" | "follow_up" | "not_attended";
  next_checkup_date: string | null;
  child_consented: boolean;
  child_accompanied_by: string;
  findings_summary: string | null;
  fluoride_varnish_applied: boolean;
  x_rays_taken: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface OralHygieneRecordInput {
  id: string;
  child_id: string;
  date: string;
  morning_brushing_completed: boolean;
  evening_brushing_completed: boolean;
  brushing_supervised: boolean;
  brushing_duration_adequate: boolean;
  mouthwash_used: boolean;
  flossing_completed: boolean;
  child_independent: boolean;
  staff_prompted: boolean;
  child_engaged: boolean;
  oral_health_education_provided: boolean;
  issues_noted: string | null;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface DentalTreatmentRecordInput {
  id: string;
  child_id: string;
  treatment_type: "filling" | "extraction" | "crown" | "root_canal" | "cleaning" | "sealant" | "fluoride" | "emergency" | "other";
  treatment_date: string;
  treatment_completed: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  pain_managed: boolean;
  aftercare_instructions_followed: boolean;
  child_consented: boolean;
  child_coped_well: boolean;
  anxiety_support_provided: boolean;
  professional_name: string;
  cost_covered: boolean;
  notes: string | null;
  created_at: string;
}

export interface OrthodonticRecordInput {
  id: string;
  child_id: string;
  treatment_type: "braces_fixed" | "braces_removable" | "retainer" | "aligner" | "expander" | "monitoring" | "other";
  start_date: string;
  appointment_date: string;
  appointment_attended: boolean;
  appliance_condition: "good" | "damaged" | "lost" | "not_applicable";
  compliance_with_instructions: boolean;
  oral_hygiene_maintained: boolean;
  discomfort_reported: boolean;
  discomfort_managed: boolean;
  next_appointment_date: string | null;
  progress_satisfactory: boolean;
  child_engaged_with_treatment: boolean;
  professional_name: string;
  notes: string | null;
  created_at: string;
}

export interface DentalAnxietyRecordInput {
  id: string;
  child_id: string;
  date: string;
  anxiety_level: number; // 1-5, where 1 is minimal anxiety and 5 is severe
  anxiety_triggers: string[];
  support_strategies_used: string[];
  desensitisation_session_completed: boolean;
  child_attended_appointment: boolean;
  child_coped_with_treatment: boolean;
  pre_appointment_preparation: boolean;
  post_appointment_debrief: boolean;
  specialist_referral_made: boolean;
  specialist_referral_attended: boolean;
  improvement_noted: boolean;
  child_feedback: string | null;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface DentalOralHealthInput {
  today: string;
  total_children: number;
  dental_checkup_records: DentalCheckupRecordInput[];
  oral_hygiene_records: OralHygieneRecordInput[];
  dental_treatment_records: DentalTreatmentRecordInput[];
  orthodontic_records: OrthodonticRecordInput[];
  dental_anxiety_records: DentalAnxietyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DentalOralHealthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DentalOralHealthInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DentalOralHealthRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DentalOralHealthResult {
  dental_rating: DentalOralHealthRating;
  dental_score: number | null;
  headline: string;
  total_checkup_records: number;
  total_treatment_records: number;
  checkup_compliance_rate: number | null;
  oral_hygiene_rate: number | null;
  treatment_completion_rate: number | null;
  orthodontic_compliance_rate: number | null;
  anxiety_support_rate: number | null;
  child_engagement_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: DentalOralHealthRecommendation[];
  insights: DentalOralHealthInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DentalOralHealthRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: DentalOralHealthRating,
  score: number,
  headline: string,
): DentalOralHealthResult {
  return {
    dental_rating: rating,
    dental_score: score,
    headline,
    total_checkup_records: 0,
    total_treatment_records: 0,
    checkup_compliance_rate: 0,
    oral_hygiene_rate: 0,
    treatment_completion_rate: 0,
    orthodontic_compliance_rate: 0,
    anxiety_support_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeDentalOralHealth(
  input: DentalOralHealthInput,
): DentalOralHealthResult {
  const {
    total_children,
    dental_checkup_records,
    oral_hygiene_records,
    dental_treatment_records,
    orthodontic_records,
    dental_anxiety_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    dental_checkup_records.length === 0 &&
    oral_hygiene_records.length === 0 &&
    dental_treatment_records.length === 0 &&
    orthodontic_records.length === 0 &&
    dental_anxiety_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess dental and oral health management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No dental or oral health data recorded despite children on placement — dental health management requires urgent attention.",
      ),
      concerns: [
        "No dental check-up records, oral hygiene records, dental treatment records, orthodontic care records, or dental anxiety support records exist despite children being on placement — the home cannot evidence adequate dental health management or oral health promotion.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of dental check-ups, daily oral hygiene routines, dental treatments, orthodontic care, and dental anxiety support to evidence the home's management of children's dental and oral health needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child is registered with a dentist, has an up-to-date dental check-up schedule, and receives daily support with oral hygiene routines appropriate to their age and needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of dental and oral health records means Ofsted cannot verify that children's dental health needs are being met, check-ups are attended, or oral hygiene is promoted. This represents a fundamental gap in Reg 14 and Reg 5 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Dental check-up metrics ---
  const totalCheckupRecords = dental_checkup_records.length;

  const checkupsAttended = dental_checkup_records.filter((r) => r.attended).length;
  const checkupComplianceRate = pct(checkupsAttended, totalCheckupRecords);

  const checkupsConsented = dental_checkup_records.filter((r) => r.child_consented).length;

  const checkupsAllClear = dental_checkup_records.filter(
    (r) => r.outcome === "all_clear",
  ).length;
  const allClearRate = pct(checkupsAllClear, totalCheckupRecords);

  // --- Oral hygiene metrics ---
  const totalHygieneRecords = oral_hygiene_records.length;

  const morningBrushingCompleted = oral_hygiene_records.filter((r) => r.morning_brushing_completed).length;
  const eveningBrushingCompleted = oral_hygiene_records.filter((r) => r.evening_brushing_completed).length;
  const bothBrushingsCompleted = oral_hygiene_records.filter(
    (r) => r.morning_brushing_completed && r.evening_brushing_completed,
  ).length;
  const brushingComplianceRate = pct(bothBrushingsCompleted, totalHygieneRecords);

  const brushingDurationAdequate = oral_hygiene_records.filter((r) => r.brushing_duration_adequate).length;

  const childEngagedHygiene = oral_hygiene_records.filter((r) => r.child_engaged).length;

  const educationProvided = oral_hygiene_records.filter((r) => r.oral_health_education_provided).length;
  const educationRate = pct(educationProvided, totalHygieneRecords);

  const childIndependent = oral_hygiene_records.filter((r) => r.child_independent).length;
  const independenceRate = pct(childIndependent, totalHygieneRecords);

  // Composite oral hygiene rate: morning + evening + duration adequate + child engaged
  const hygieneNumerator = morningBrushingCompleted + eveningBrushingCompleted + brushingDurationAdequate + childEngagedHygiene;
  const hygieneDenominator = totalHygieneRecords * 4;
  const oralHygieneRate = pct(hygieneNumerator, hygieneDenominator);

  // --- Dental treatment metrics ---
  const totalTreatmentRecords = dental_treatment_records.length;

  const treatmentsCompleted = dental_treatment_records.filter((r) => r.treatment_completed).length;
  const treatmentCompletionRate = pct(treatmentsCompleted, totalTreatmentRecords);

  const treatmentFollowUpRequired = dental_treatment_records.filter((r) => r.follow_up_required).length;
  const treatmentFollowUpCompleted = dental_treatment_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const treatmentFollowUpRate = pct(treatmentFollowUpCompleted, treatmentFollowUpRequired);

  const painManaged = dental_treatment_records.filter((r) => r.pain_managed).length;
  const painManagementRate = pct(painManaged, totalTreatmentRecords);

  const aftercareFollowed = dental_treatment_records.filter((r) => r.aftercare_instructions_followed).length;
  const aftercareRate = pct(aftercareFollowed, totalTreatmentRecords);

  const treatmentConsented = dental_treatment_records.filter((r) => r.child_consented).length;

  const childCopedWell = dental_treatment_records.filter((r) => r.child_coped_well).length;
  const copingRate = pct(childCopedWell, totalTreatmentRecords);

  // --- Orthodontic metrics ---
  const totalOrthoRecords = orthodontic_records.length;

  const orthoAppointmentsAttended = orthodontic_records.filter((r) => r.appointment_attended).length;

  const orthoCompliant = orthodontic_records.filter((r) => r.compliance_with_instructions).length;

  const orthoHygieneMaintained = orthodontic_records.filter((r) => r.oral_hygiene_maintained).length;

  const orthoProgressSatisfactory = orthodontic_records.filter((r) => r.progress_satisfactory).length;
  const orthoProgressRate = pct(orthoProgressSatisfactory, totalOrthoRecords);

  const orthoChildEngaged = orthodontic_records.filter((r) => r.child_engaged_with_treatment).length;

  const orthoDiscomfortReported = orthodontic_records.filter((r) => r.discomfort_reported).length;
  const orthoDiscomfortManaged = orthodontic_records.filter(
    (r) => r.discomfort_reported && r.discomfort_managed,
  ).length;
  const orthoDiscomfortManagedRate = pct(orthoDiscomfortManaged, orthoDiscomfortReported);

  const applianceDamaged = orthodontic_records.filter(
    (r) => r.appliance_condition === "damaged" || r.appliance_condition === "lost",
  ).length;
  const applianceIssueRate = pct(applianceDamaged, totalOrthoRecords);

  // Composite orthodontic compliance: attended + compliant with instructions + hygiene maintained + engaged
  const orthoComplianceNumerator = orthoAppointmentsAttended + orthoCompliant + orthoHygieneMaintained + orthoChildEngaged;
  const orthoComplianceDenominator = totalOrthoRecords * 4;
  const orthodonticComplianceRate = pct(orthoComplianceNumerator, orthoComplianceDenominator);

  // --- Dental anxiety metrics ---
  const totalAnxietyRecords = dental_anxiety_records.length;

  const preAppointmentPrep = dental_anxiety_records.filter((r) => r.pre_appointment_preparation).length;

  const postAppointmentDebrief = dental_anxiety_records.filter((r) => r.post_appointment_debrief).length;

  const desensitisationCompleted = dental_anxiety_records.filter((r) => r.desensitisation_session_completed).length;
  const desensitisationRate = pct(desensitisationCompleted, totalAnxietyRecords);

  const anxietyChildAttended = dental_anxiety_records.filter((r) => r.child_attended_appointment).length;
  const anxietyAttendanceRate = pct(anxietyChildAttended, totalAnxietyRecords);

  const anxietyChildCoped = dental_anxiety_records.filter((r) => r.child_coped_with_treatment).length;

  const anxietyImproved = dental_anxiety_records.filter((r) => r.improvement_noted).length;
  const anxietyImprovementRate = pct(anxietyImproved, totalAnxietyRecords);

  // Composite anxiety support rate: pre-prep + debrief + desensitisation + child coped
  const anxietySupportNumerator = preAppointmentPrep + postAppointmentDebrief + desensitisationCompleted + anxietyChildCoped;
  const anxietySupportDenominator = totalAnxietyRecords * 4;
  const anxietySupportRate = pct(anxietySupportNumerator, anxietySupportDenominator);

  // Average anxiety level
  const anxietyLevelSum = dental_anxiety_records.reduce((sum, r) => sum + r.anxiety_level, 0);
  const avgAnxietyLevel =
    totalAnxietyRecords > 0
      ? Math.round((anxietyLevelSum / totalAnxietyRecords) * 100) / 100
      : null;

  // --- Child engagement composite ---
  // Composite across: hygiene engagement + checkup consent + treatment consent + ortho engagement
  let engagementNumerator = 0;
  let engagementDenominator = 0;

  if (totalHygieneRecords > 0) {
    engagementNumerator += childEngagedHygiene;
    engagementDenominator += totalHygieneRecords;
  }
  if (totalCheckupRecords > 0) {
    engagementNumerator += checkupsConsented;
    engagementDenominator += totalCheckupRecords;
  }
  if (totalTreatmentRecords > 0) {
    engagementNumerator += treatmentConsented;
    engagementDenominator += totalTreatmentRecords;
  }
  if (totalOrthoRecords > 0) {
    engagementNumerator += orthoChildEngaged;
    engagementDenominator += totalOrthoRecords;
  }

  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: checkupComplianceRate (>=90: +4, >=70: +2) ---
  if (checkupComplianceRate >= 90) score += 4;
  else if (checkupComplianceRate >= 70) score += 2;

  // --- Bonus 2: oralHygieneRate (>=90: +3, >=70: +1) ---
  if (oralHygieneRate >= 90) score += 3;
  else if (oralHygieneRate >= 70) score += 1;

  // --- Bonus 3: treatmentCompletionRate (>=90: +4, >=70: +2) ---
  if (treatmentCompletionRate >= 90) score += 4;
  else if (treatmentCompletionRate >= 70) score += 2;

  // --- Bonus 4: orthodonticComplianceRate (>=85: +3, >=65: +1) ---
  if (orthodonticComplianceRate >= 85) score += 3;
  else if (orthodonticComplianceRate >= 65) score += 1;

  // --- Bonus 5: anxietySupportRate (>=85: +3, >=65: +1) ---
  if (anxietySupportRate >= 85) score += 3;
  else if (anxietySupportRate >= 65) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: treatmentFollowUpRate (>=90: +3, >=70: +1) ---
  if (treatmentFollowUpRate >= 90) score += 3;
  else if (treatmentFollowUpRate >= 70) score += 1;

  // --- Bonus 8: aftercareRate (>=90: +2, >=70: +1) ---
  if (aftercareRate >= 90) score += 2;
  else if (aftercareRate >= 70) score += 1;

  // --- Bonus 9: painManagementRate (>=90: +3, >=70: +1) ---
  if (painManagementRate >= 90) score += 3;
  else if (painManagementRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // checkupComplianceRate < 50 → -5
  if (checkupComplianceRate < 50 && totalCheckupRecords > 0) score -= 5;

  // oralHygieneRate < 40 → -5
  if (oralHygieneRate < 40 && totalHygieneRecords > 0) score -= 5;

  // treatmentCompletionRate < 50 → -5
  if (treatmentCompletionRate < 50 && totalTreatmentRecords > 0) score -= 5;

  // anxietySupportRate < 40 → -3
  if (anxietySupportRate < 40 && totalAnxietyRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const dental_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (checkupComplianceRate >= 90 && totalCheckupRecords > 0) {
    strengths.push(
      `${checkupComplianceRate}% dental check-up compliance — children attend dental appointments consistently, ensuring early identification and prevention of dental health issues.`,
    );
  } else if (checkupComplianceRate >= 70 && totalCheckupRecords > 0) {
    strengths.push(
      `${checkupComplianceRate}% dental check-up compliance — the home generally ensures children attend their scheduled dental appointments.`,
    );
  }

  if (oralHygieneRate >= 90 && totalHygieneRecords > 0) {
    strengths.push(
      `${oralHygieneRate}% oral hygiene adherence — children consistently complete brushing routines with adequate duration and engagement, demonstrating embedded oral health habits.`,
    );
  } else if (oralHygieneRate >= 70 && totalHygieneRecords > 0) {
    strengths.push(
      `${oralHygieneRate}% oral hygiene adherence — the home maintains generally good oral hygiene routines for children.`,
    );
  }

  if (treatmentCompletionRate >= 90 && totalTreatmentRecords > 0) {
    strengths.push(
      `${treatmentCompletionRate}% dental treatment completion — all prescribed dental treatments are followed through to completion, ensuring children receive the care they need.`,
    );
  } else if (treatmentCompletionRate >= 70 && totalTreatmentRecords > 0) {
    strengths.push(
      `${treatmentCompletionRate}% dental treatment completion — the home generally ensures prescribed dental treatments are completed.`,
    );
  }

  if (orthodonticComplianceRate >= 85 && totalOrthoRecords > 0) {
    strengths.push(
      `${orthodonticComplianceRate}% orthodontic compliance — children attend orthodontic appointments, follow instructions, maintain hygiene, and engage positively with their treatment.`,
    );
  } else if (orthodonticComplianceRate >= 65 && totalOrthoRecords > 0) {
    strengths.push(
      `${orthodonticComplianceRate}% orthodontic compliance — orthodontic care is generally well managed across the home.`,
    );
  }

  if (anxietySupportRate >= 85 && totalAnxietyRecords > 0) {
    strengths.push(
      `${anxietySupportRate}% dental anxiety support — children with dental anxiety receive comprehensive preparation, desensitisation, and post-appointment support, enabling them to access dental care.`,
    );
  } else if (anxietySupportRate >= 65 && totalAnxietyRecords > 0) {
    strengths.push(
      `${anxietySupportRate}% dental anxiety support — the home provides generally effective support for children with dental anxiety.`,
    );
  }

  if (childEngagementRate >= 90) {
    strengths.push(
      `${childEngagementRate}% child engagement across dental care — children actively participate in and consent to their dental health management, reflecting genuine partnership in their care.`,
    );
  } else if (childEngagementRate >= 70) {
    strengths.push(
      `${childEngagementRate}% child engagement — most children are positively engaged with their dental care across check-ups, hygiene, and treatment.`,
    );
  }

  if (painManagementRate >= 90 && totalTreatmentRecords > 0) {
    strengths.push(
      `${painManagementRate}% pain management during dental treatment — children's pain is consistently managed during procedures, demonstrating attentive, child-centred clinical care.`,
    );
  } else if (painManagementRate >= 70 && totalTreatmentRecords > 0) {
    strengths.push(
      `${painManagementRate}% pain management — pain is generally well managed during children's dental treatments.`,
    );
  }

  if (aftercareRate >= 90 && totalTreatmentRecords > 0) {
    strengths.push(
      `${aftercareRate}% aftercare instruction compliance — post-treatment care is consistently followed, promoting healing and preventing complications.`,
    );
  } else if (aftercareRate >= 70 && totalTreatmentRecords > 0) {
    strengths.push(
      `${aftercareRate}% aftercare compliance — post-treatment instructions are generally followed for children's dental procedures.`,
    );
  }

  if (treatmentFollowUpRate >= 90 && treatmentFollowUpRequired > 0) {
    strengths.push(
      `${treatmentFollowUpRate}% treatment follow-up completion — all required follow-up appointments are attended, ensuring continuity of dental care.`,
    );
  } else if (treatmentFollowUpRate >= 70 && treatmentFollowUpRequired > 0) {
    strengths.push(
      `${treatmentFollowUpRate}% treatment follow-up completion — the home generally ensures follow-up dental appointments are attended.`,
    );
  }

  if (educationRate >= 90 && totalHygieneRecords > 0) {
    strengths.push(
      `${educationRate}% oral health education delivery — children consistently receive age-appropriate oral health education alongside their daily routines, building lifelong healthy habits.`,
    );
  } else if (educationRate >= 70 && totalHygieneRecords > 0) {
    strengths.push(
      `${educationRate}% oral health education — the home regularly provides oral health education to support children's understanding of dental care.`,
    );
  }

  if (brushingComplianceRate >= 90 && totalHygieneRecords > 0) {
    strengths.push(
      `${brushingComplianceRate}% twice-daily brushing compliance — children consistently complete both morning and evening brushing, establishing essential dental hygiene habits.`,
    );
  }

  if (anxietyImprovementRate >= 80 && totalAnxietyRecords > 0) {
    strengths.push(
      `${anxietyImprovementRate}% improvement noted in children with dental anxiety — the home's support strategies are effectively reducing dental anxiety and enabling children to access care.`,
    );
  }

  if (orthoDiscomfortManagedRate >= 90 && orthoDiscomfortReported > 0) {
    strengths.push(
      `${orthoDiscomfortManagedRate}% of orthodontic discomfort effectively managed — children's orthodontic discomfort is promptly addressed, preventing unnecessary suffering.`,
    );
  }

  if (desensitisationRate >= 80 && totalAnxietyRecords > 0) {
    strengths.push(
      `${desensitisationRate}% desensitisation session completion — the home actively uses desensitisation techniques to help children overcome dental anxiety, reflecting trauma-informed dental care practice.`,
    );
  }

  if (allClearRate >= 80 && totalCheckupRecords > 0) {
    strengths.push(
      `${allClearRate}% of dental check-ups result in all-clear outcomes — children's oral health is being well maintained through effective preventive care.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (checkupComplianceRate < 50 && totalCheckupRecords > 0) {
    concerns.push(
      `Only ${checkupComplianceRate}% dental check-up compliance — the majority of scheduled dental appointments are not being attended, which directly compromises children's dental health and the home's ability to identify oral health problems early.`,
    );
  } else if (checkupComplianceRate < 70 && checkupComplianceRate >= 50 && totalCheckupRecords > 0) {
    concerns.push(
      `Dental check-up compliance at ${checkupComplianceRate}% — a significant proportion of dental appointments are missed, risking undetected dental issues and delayed treatment.`,
    );
  }

  if (oralHygieneRate < 40 && totalHygieneRecords > 0) {
    concerns.push(
      `Oral hygiene adherence at only ${oralHygieneRate}% — children's daily brushing routines are not being completed consistently, duration is inadequate, and engagement is poor. This poses a direct risk to children's dental health.`,
    );
  } else if (oralHygieneRate < 70 && oralHygieneRate >= 40 && totalHygieneRecords > 0) {
    concerns.push(
      `Oral hygiene adherence at ${oralHygieneRate}% — daily oral hygiene routines need improvement to protect children's dental health.`,
    );
  }

  if (treatmentCompletionRate < 50 && totalTreatmentRecords > 0) {
    concerns.push(
      `Only ${treatmentCompletionRate}% dental treatment completion — the majority of prescribed dental treatments are not being completed, leaving children with untreated dental conditions that may worsen and cause pain or infection.`,
    );
  } else if (treatmentCompletionRate < 70 && treatmentCompletionRate >= 50 && totalTreatmentRecords > 0) {
    concerns.push(
      `Dental treatment completion at ${treatmentCompletionRate}% — some prescribed treatments are not being followed through to completion.`,
    );
  }

  if (orthodonticComplianceRate < 50 && totalOrthoRecords > 0) {
    concerns.push(
      `Orthodontic compliance at only ${orthodonticComplianceRate}% — children's orthodontic care is poorly managed, with missed appointments, non-compliance with instructions, or poor hygiene maintenance, risking treatment failure.`,
    );
  } else if (orthodonticComplianceRate < 65 && orthodonticComplianceRate >= 50 && totalOrthoRecords > 0) {
    concerns.push(
      `Orthodontic compliance at ${orthodonticComplianceRate}% — orthodontic care management needs improvement to prevent treatment delays or complications.`,
    );
  }

  if (anxietySupportRate < 40 && totalAnxietyRecords > 0) {
    concerns.push(
      `Dental anxiety support at only ${anxietySupportRate}% — children with dental anxiety are not receiving adequate preparation, desensitisation, or post-appointment support, which may prevent them from accessing essential dental care.`,
    );
  } else if (anxietySupportRate < 65 && anxietySupportRate >= 40 && totalAnxietyRecords > 0) {
    concerns.push(
      `Dental anxiety support at ${anxietySupportRate}% — the support provided to children with dental anxiety needs strengthening to ensure they can access dental care.`,
    );
  }

  if (childEngagementRate < 50) {
    concerns.push(
      `Child engagement with dental care at only ${childEngagementRate}% — children are not actively participating in or consenting to their dental health management, which undermines their autonomy and may indicate a lack of age-appropriate preparation.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — a notable proportion of children are not positively engaged with their dental care.`,
    );
  }

  if (painManagementRate < 50 && totalTreatmentRecords > 0) {
    concerns.push(
      `Pain management during dental treatment at only ${painManagementRate}% — children are experiencing unmanaged pain during dental procedures, which is unacceptable and may compound dental anxiety.`,
    );
  } else if (painManagementRate < 70 && painManagementRate >= 50 && totalTreatmentRecords > 0) {
    concerns.push(
      `Pain management at ${painManagementRate}% — not all children's pain is being adequately managed during dental treatment.`,
    );
  }

  if (treatmentFollowUpRate < 50 && treatmentFollowUpRequired > 0) {
    concerns.push(
      `Only ${treatmentFollowUpRate}% of required treatment follow-ups completed — children are not attending follow-up dental appointments, risking complications from incomplete treatment.`,
    );
  } else if (treatmentFollowUpRate < 70 && treatmentFollowUpRate >= 50 && treatmentFollowUpRequired > 0) {
    concerns.push(
      `Treatment follow-up rate at ${treatmentFollowUpRate}% — some required dental follow-up appointments are being missed.`,
    );
  }

  if (applianceIssueRate > 30 && totalOrthoRecords > 0) {
    concerns.push(
      `${applianceIssueRate}% of orthodontic records show damaged or lost appliances — this indicates children may not be receiving adequate support to care for their orthodontic appliances, or there may be underlying resistance to treatment.`,
    );
  }

  if (brushingComplianceRate < 50 && totalHygieneRecords > 0) {
    concerns.push(
      `Only ${brushingComplianceRate}% twice-daily brushing compliance — the majority of children are not completing both morning and evening brushing, the fundamental basis of oral health.`,
    );
  }

  if ((avgAnxietyLevel ?? 0) >= 4.0 && totalAnxietyRecords > 0) {
    concerns.push(
      `Average dental anxiety level at ${avgAnxietyLevel}/5 — children are experiencing high levels of dental anxiety that require specialist intervention and trauma-informed approaches.`,
    );
  } else if ((avgAnxietyLevel ?? 0) >= 3.0 && (avgAnxietyLevel ?? 0) < 4.0 && totalAnxietyRecords > 0) {
    concerns.push(
      `Average dental anxiety level at ${avgAnxietyLevel}/5 — dental anxiety is moderate across the home and may be preventing some children from fully engaging with dental care.`,
    );
  }

  if (totalCheckupRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No dental check-up records exist despite children being on placement — the home cannot evidence that children are registered with a dentist or attending regular check-ups.",
    );
  }

  if (totalHygieneRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No oral hygiene records exist despite children being on placement — the home cannot evidence that daily dental hygiene routines are in place or being followed.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: DentalOralHealthRecommendation[] = [];
  let rank = 0;

  if (checkupComplianceRate < 50 && totalCheckupRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve dental check-up attendance — ensure every child is registered with an NHS dentist, has a scheduled check-up within the next 6 weeks, and that barriers to attendance (anxiety, transport, consent) are identified and addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (treatmentCompletionRate < 50 && totalTreatmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all prescribed dental treatments are completed — uncompleted treatments expose children to risk of worsening dental conditions, pain, and infection. Implement a treatment tracking system with clear staff accountability.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (oralHygieneRate < 40 && totalHygieneRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul daily oral hygiene routines — ensure every child brushes morning and evening with appropriate supervision, introduce engaging oral health education, and review individual barriers to compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (painManagementRate < 50 && totalTreatmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's pain is managed during all dental procedures — liaise with dental professionals to confirm pain management protocols are in place and advocate for children's comfort during treatment.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (anxietySupportRate < 40 && totalAnxietyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement comprehensive dental anxiety support — provide pre-appointment preparation, desensitisation sessions, and post-appointment debriefs for all children with dental anxiety. Consider specialist referrals for children with severe anxiety.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (totalCheckupRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Register all children with a dentist and schedule check-ups immediately — the absence of any dental check-up records means the home cannot evidence compliance with the duty to promote children's dental health.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalHygieneRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement daily oral hygiene recording for all children — document morning and evening brushing, supervision levels, and engagement to evidence that the home promotes daily dental care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (childEngagementRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's engagement with dental care — use age-appropriate preparation, involve children in decisions about their dental health, and seek their views on how dental care can be made more comfortable.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (treatmentFollowUpRate < 50 && treatmentFollowUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a dental follow-up tracker — ensure all required follow-up appointments are scheduled, attended, and documented. Unattended follow-ups risk incomplete treatment and worsening conditions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (orthodonticComplianceRate < 50 && totalOrthoRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review orthodontic care management — ensure children attend appointments, comply with instructions, and maintain oral hygiene during orthodontic treatment. Engage children in understanding the importance of their treatment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    checkupComplianceRate >= 50 &&
    checkupComplianceRate < 70 &&
    totalCheckupRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve dental check-up compliance to at least 70% — review appointment scheduling, transport arrangements, and child preparation to reduce missed check-ups.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    oralHygieneRate >= 40 &&
    oralHygieneRate < 70 &&
    totalHygieneRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen daily oral hygiene routines — ensure brushing duration is adequate, staff provide appropriate supervision, and children are engaged through education and encouragement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (
    treatmentCompletionRate >= 50 &&
    treatmentCompletionRate < 70 &&
    totalTreatmentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve dental treatment follow-through — ensure all prescribed treatments are scheduled and completed within appropriate timeframes to prevent dental conditions from worsening.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    anxietySupportRate >= 40 &&
    anxietySupportRate < 65 &&
    totalAnxietyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance dental anxiety support — increase consistency of pre-appointment preparation, desensitisation activities, and post-appointment debriefs to help children manage their dental anxiety more effectively.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (
    orthodonticComplianceRate >= 50 &&
    orthodonticComplianceRate < 65 &&
    totalOrthoRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve orthodontic compliance through engagement — help children understand the benefits of their treatment, develop routines for appliance care, and ensure appointment attendance is prioritised.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's active participation in dental care decisions — use age-appropriate explanations, seek consent meaningfully, and involve children in planning their dental appointments.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (educationRate < 50 && totalHygieneRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase oral health education delivery — provide regular, age-appropriate information about dental hygiene, diet and sugar, and the importance of dental care to embed lifelong healthy habits.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (aftercareRate < 70 && totalTreatmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve aftercare instruction compliance — ensure staff understand and implement post-treatment care instructions, including dietary restrictions, pain management, and hygiene modifications.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (applianceIssueRate > 30 && totalOrthoRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address high rate of damaged or lost orthodontic appliances — provide children with practical support and education on appliance care, and investigate whether appliance issues indicate resistance to treatment.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: DentalOralHealthInsight[] = [];

  // -- Critical insights --

  if (checkupComplianceRate < 50 && totalCheckupRecords > 0) {
    insights.push({
      text: `Only ${checkupComplianceRate}% dental check-up compliance. Ofsted expects looked-after children to have regular dental check-ups as part of their health care. Poor attendance means dental problems go undetected, leading to preventable pain, infection, and more invasive treatment.`,
      severity: "critical",
    });
  }

  if (oralHygieneRate < 40 && totalHygieneRecords > 0) {
    insights.push({
      text: `Oral hygiene adherence at only ${oralHygieneRate}%. Daily oral hygiene is the foundation of dental health. When children are not consistently brushing, with adequate supervision and engagement, the home is failing in its duty to promote basic health care habits under Reg 14.`,
      severity: "critical",
    });
  }

  if (treatmentCompletionRate < 50 && totalTreatmentRecords > 0) {
    insights.push({
      text: `Only ${treatmentCompletionRate}% dental treatment completion. Incomplete dental treatment leaves children with active dental disease that worsens over time. The home must ensure every prescribed treatment is completed to meet its statutory health care obligations.`,
      severity: "critical",
    });
  }

  if (painManagementRate < 50 && totalTreatmentRecords > 0) {
    insights.push({
      text: `Pain management at only ${painManagementRate}%. Children experiencing unmanaged pain during dental procedures may develop severe dental phobia, refuse future treatment, and suffer unnecessarily. This requires immediate liaison with dental professionals.`,
      severity: "critical",
    });
  }

  if (anxietySupportRate < 40 && totalAnxietyRecords > 0) {
    insights.push({
      text: `Dental anxiety support at only ${anxietySupportRate}%. Many looked-after children have heightened dental anxiety due to previous neglect, trauma, or lack of dental experience. Without adequate support, these children may be unable to access dental care at all, creating a cycle of worsening dental health.`,
      severity: "critical",
    });
  }

  if (totalCheckupRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No dental check-up records exist despite children being on placement. Without check-up records, the home cannot evidence that children are registered with a dentist or receiving regular dental care. This is a fundamental gap in Reg 14 compliance.",
      severity: "critical",
    });
  }

  if (totalHygieneRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No oral hygiene records exist despite children being on placement. Without daily hygiene records, the home cannot demonstrate that it promotes basic dental care routines. Daily brushing is a minimum standard of care for all children.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    checkupComplianceRate >= 50 &&
    checkupComplianceRate < 70 &&
    totalCheckupRecords > 0
  ) {
    insights.push({
      text: `Dental check-up compliance at ${checkupComplianceRate}% — improving but inconsistent. Some children are missing dental appointments, meaning dental problems may develop without detection. Review barriers to attendance for individual children.`,
      severity: "warning",
    });
  }

  if (
    oralHygieneRate >= 40 &&
    oralHygieneRate < 70 &&
    totalHygieneRecords > 0
  ) {
    insights.push({
      text: `Oral hygiene adherence at ${oralHygieneRate}% — daily dental care routines need strengthening. Inconsistent brushing, inadequate duration, or low engagement undermine the protective benefits of regular oral hygiene.`,
      severity: "warning",
    });
  }

  if (
    treatmentCompletionRate >= 50 &&
    treatmentCompletionRate < 70 &&
    totalTreatmentRecords > 0
  ) {
    insights.push({
      text: `Dental treatment completion at ${treatmentCompletionRate}% — some prescribed treatments are not being followed through. Incomplete treatment can result in recurring pain, infection, and the need for more extensive procedures.`,
      severity: "warning",
    });
  }

  if (
    orthodonticComplianceRate >= 50 &&
    orthodonticComplianceRate < 65 &&
    totalOrthoRecords > 0
  ) {
    insights.push({
      text: `Orthodontic compliance at ${orthodonticComplianceRate}% — attendance, instruction compliance, hygiene, or engagement during orthodontic treatment needs improvement. Poor compliance can extend treatment duration and affect outcomes.`,
      severity: "warning",
    });
  }

  if (
    anxietySupportRate >= 40 &&
    anxietySupportRate < 65 &&
    totalAnxietyRecords > 0
  ) {
    insights.push({
      text: `Dental anxiety support at ${anxietySupportRate}% — children with dental anxiety are not consistently receiving preparation, desensitisation, or debriefing. Without structured support, dental anxiety tends to worsen over time.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70
  ) {
    insights.push({
      text: `Child engagement with dental care at ${childEngagementRate}% — some children are not positively participating in their dental health management. Low engagement may indicate inadequate preparation, poor communication, or dental anxiety.`,
      severity: "warning",
    });
  }

  if (
    treatmentFollowUpRate >= 50 &&
    treatmentFollowUpRate < 70 &&
    treatmentFollowUpRequired > 0
  ) {
    insights.push({
      text: `Treatment follow-up rate at ${treatmentFollowUpRate}% — some dental follow-up appointments are being missed. Incomplete follow-through risks treatment failure and may require re-intervention.`,
      severity: "warning",
    });
  }

  if (
    aftercareRate >= 50 &&
    aftercareRate < 70 &&
    totalTreatmentRecords > 0
  ) {
    insights.push({
      text: `Aftercare instruction compliance at ${aftercareRate}% — post-treatment care is inconsistent. Failure to follow aftercare instructions can lead to complications, delayed healing, and treatment failure.`,
      severity: "warning",
    });
  }

  if (
    (avgAnxietyLevel ?? 0) >= 3.0 &&
    (avgAnxietyLevel ?? 0) < 4.0 &&
    totalAnxietyRecords > 0
  ) {
    insights.push({
      text: `Average dental anxiety level at ${avgAnxietyLevel}/5 — moderate anxiety across children with dental fear. Targeted desensitisation programmes, therapeutic support, and trauma-informed dental practice can significantly reduce anxiety over time.`,
      severity: "warning",
    });
  }

  if (educationRate < 50 && totalHygieneRecords > 0) {
    insights.push({
      text: `Oral health education at only ${educationRate}% — children are not consistently receiving education about dental hygiene, diet, and oral health. Education is essential for developing independent self-care skills.`,
      severity: "warning",
    });
  }

  if (applianceIssueRate > 30 && totalOrthoRecords > 0) {
    insights.push({
      text: `${applianceIssueRate}% of orthodontic records show damaged or lost appliances — repeated appliance issues may indicate the child needs additional support, education about appliance care, or may be struggling with their treatment.`,
      severity: "warning",
    });
  }

  // Treatment type analysis
  const treatmentTypes: Record<string, number> = {};
  for (const t of dental_treatment_records) {
    treatmentTypes[t.treatment_type] = (treatmentTypes[t.treatment_type] ?? 0) + 1;
  }
  const topTreatments = Object.entries(treatmentTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTreatments.length > 0) {
    const formatted = topTreatments
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common dental treatments: ${formatted}. Understanding treatment patterns helps identify whether preventive care is reducing the need for restorative interventions. High rates of fillings or extractions may indicate inadequate prevention.`,
      severity: "warning",
    });
  }

  // Anxiety trigger analysis
  const triggerCounts: Record<string, number> = {};
  for (const a of dental_anxiety_records) {
    for (const trigger of a.anxiety_triggers) {
      triggerCounts[trigger] = (triggerCounts[trigger] ?? 0) + 1;
    }
  }
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTriggers.length > 0) {
    const formatted = topTriggers
      .map(([trigger, count]) => `${trigger.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common dental anxiety triggers: ${formatted}. Identifying specific triggers enables targeted desensitisation and tailored support strategies for each child.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (dental_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding dental and oral health management — children attend dental appointments consistently, oral hygiene routines are well embedded, treatments are completed, anxiety is effectively supported, and children are actively engaged in their dental care. This is strong evidence for Reg 14 and Reg 5 compliance.",
      severity: "positive",
    });
  }

  if (
    checkupComplianceRate >= 90 &&
    treatmentCompletionRate >= 90 &&
    totalCheckupRecords > 0 &&
    totalTreatmentRecords > 0
  ) {
    insights.push({
      text: `${checkupComplianceRate}% check-up compliance with ${treatmentCompletionRate}% treatment completion — the combination of regular attendance and treatment follow-through demonstrates comprehensive dental health management that prevents deterioration and promotes children's wellbeing.`,
      severity: "positive",
    });
  }

  if (
    oralHygieneRate >= 90 &&
    educationRate >= 80 &&
    totalHygieneRecords > 0
  ) {
    insights.push({
      text: `${oralHygieneRate}% oral hygiene adherence with ${educationRate}% education delivery — children are consistently completing dental hygiene routines and receiving education that builds lifelong healthy habits. This proactive approach reduces future dental treatment needs.`,
      severity: "positive",
    });
  }

  if (
    anxietySupportRate >= 85 &&
    anxietyImprovementRate >= 70 &&
    totalAnxietyRecords > 0
  ) {
    insights.push({
      text: `${anxietySupportRate}% anxiety support with ${anxietyImprovementRate}% improvement noted — the home's dental anxiety support programme is effectively enabling children to overcome their fears and access dental care. This reflects trauma-informed, child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement across dental care — children actively participate in and consent to their dental health management. High engagement leads to better outcomes, greater independence, and positive lifelong dental habits.`,
      severity: "positive",
    });
  }

  if (
    orthodonticComplianceRate >= 85 &&
    orthoProgressRate >= 80 &&
    totalOrthoRecords > 0
  ) {
    insights.push({
      text: `${orthodonticComplianceRate}% orthodontic compliance with ${orthoProgressRate}% satisfactory progress — children's orthodontic treatment is well managed, with good attendance, compliance, and outcomes. This demonstrates the home's commitment to comprehensive dental care.`,
      severity: "positive",
    });
  }

  if (
    painManagementRate >= 90 &&
    copingRate >= 80 &&
    totalTreatmentRecords > 0
  ) {
    insights.push({
      text: `${painManagementRate}% pain management with ${copingRate}% of children coping well — dental treatments are delivered in a way that minimises discomfort and supports children through procedures. Effective pain management prevents the development of dental phobia.`,
      severity: "positive",
    });
  }

  if (
    treatmentFollowUpRate >= 90 &&
    aftercareRate >= 90 &&
    treatmentFollowUpRequired > 0 &&
    totalTreatmentRecords > 0
  ) {
    insights.push({
      text: `${treatmentFollowUpRate}% follow-up completion with ${aftercareRate}% aftercare compliance — the home ensures complete continuity of dental care from initial treatment through follow-up and aftercare. This comprehensive approach prevents complications and promotes healing.`,
      severity: "positive",
    });
  }

  if (
    brushingComplianceRate >= 90 &&
    independenceRate >= 70 &&
    totalHygieneRecords > 0
  ) {
    insights.push({
      text: `${brushingComplianceRate}% twice-daily brushing with ${independenceRate}% child independence — children are developing autonomous oral hygiene habits. This is an important life skill that will serve them well beyond the care setting.`,
      severity: "positive",
    });
  }

  if (
    desensitisationRate >= 80 &&
    anxietyAttendanceRate >= 80 &&
    totalAnxietyRecords > 0
  ) {
    insights.push({
      text: `${desensitisationRate}% desensitisation completion with ${anxietyAttendanceRate}% appointment attendance for anxious children — structured desensitisation programmes are successfully enabling children to attend dental appointments despite their anxiety.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (dental_rating === "outstanding") {
    headline =
      "Outstanding dental and oral health management — children attend dental appointments consistently, oral hygiene is well embedded, and dental anxiety is effectively supported.";
  } else if (dental_rating === "good") {
    headline = `Good dental and oral health management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (dental_rating === "adequate") {
    headline = `Adequate dental and oral health management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's dental health needs are consistently met.`;
  } else {
    headline = `Dental and oral health management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's dental health is properly managed.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    dental_rating,
    dental_score: score,
    headline,
    total_checkup_records: totalCheckupRecords,
    total_treatment_records: totalTreatmentRecords,
    checkup_compliance_rate: checkupComplianceRate,
    oral_hygiene_rate: oralHygieneRate,
    treatment_completion_rate: treatmentCompletionRate,
    orthodontic_compliance_rate: orthodonticComplianceRate,
    anxiety_support_rate: anxietySupportRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
