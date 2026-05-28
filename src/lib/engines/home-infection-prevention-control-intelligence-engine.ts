// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INFECTION PREVENTION & CONTROL INTELLIGENCE ENGINE
// Tracks infection control effectiveness — hygiene audits, illness outbreak
// management, hand hygiene compliance, cleaning schedules, and immunisation
// tracking. Critical for Ofsted under Children's Homes Regulations 2015.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 14 (Health care),
// Reg 25 (Premises), SCCIF health and wellbeing.
// Store keys: hygieneAuditRecords, illnessOutbreakRecords,
//             handHygieneRecords, cleaningScheduleRecords,
//             immunisationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HygieneAuditRecordInput {
  id: string;
  audit_date: string;
  auditor: string;
  area_audited: string;
  hand_wash_stations_adequate: boolean;
  soap_dispensers_stocked: boolean;
  sanitiser_available: boolean;
  waste_disposal_compliant: boolean;
  laundry_procedures_followed: boolean;
  food_hygiene_compliant: boolean;
  personal_protective_equipment_available: boolean;
  infection_control_signage_displayed: boolean;
  overall_compliance_score: number; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  corrective_actions: string | null;
  next_audit_date: string | null;
  created_at: string;
}

export interface IllnessOutbreakRecordInput {
  id: string;
  child_id: string;
  illness_type: "gastro" | "respiratory" | "skin_infection" | "conjunctivitis" | "head_lice" | "flu" | "covid" | "chickenpox" | "other";
  onset_date: string;
  reported_date: string;
  isolation_measures_implemented: boolean;
  gp_consulted: boolean;
  public_health_notified: boolean;
  children_affected_count: number;
  staff_affected_count: number;
  containment_actions_taken: string | null;
  containment_effective: boolean;
  duration_days: number | null;
  resolution_date: string | null;
  return_to_normal_date: string | null;
  lessons_learned_documented: boolean;
  staff_member: string;
  created_at: string;
}

export interface HandHygieneRecordInput {
  id: string;
  observation_date: string;
  observer: string;
  staff_id: string;
  staff_name: string;
  opportunity_type: "before_food_prep" | "after_toilet" | "after_nappy_change" | "before_medication" | "after_cleaning" | "after_contact_bodily_fluid" | "general_hand_wash" | "other";
  hand_hygiene_performed: boolean;
  technique_correct: boolean;
  soap_or_sanitiser_used: boolean;
  duration_adequate: boolean;
  gloves_used_when_required: boolean;
  training_completed: boolean;
  training_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface CleaningScheduleRecordInput {
  id: string;
  scheduled_date: string;
  area: string;
  cleaning_type: "daily_routine" | "deep_clean" | "outbreak_response" | "kitchen" | "bathroom" | "bedroom" | "communal" | "laundry" | "other";
  completed: boolean;
  completed_by: string | null;
  completion_time: string | null;
  products_used_correctly: boolean;
  checked_by: string | null;
  check_passed: boolean;
  issues_found: string | null;
  issues_addressed: boolean;
  frequency: "daily" | "weekly" | "monthly" | "ad_hoc";
  created_at: string;
}

export interface ImmunisationRecordInput {
  id: string;
  child_id: string;
  vaccine_name: string;
  due_date: string;
  administered: boolean;
  administered_date: string | null;
  declined: boolean;
  decline_reason: string | null;
  consent_obtained: boolean;
  consent_from: string | null;
  gp_confirmed: boolean;
  catch_up_plan_in_place: boolean;
  next_due_date: string | null;
  staff_member: string;
  created_at: string;
}

export interface InfectionPreventionInput {
  today: string;
  total_children: number;
  hygiene_audit_records: HygieneAuditRecordInput[];
  illness_outbreak_records: IllnessOutbreakRecordInput[];
  hand_hygiene_records: HandHygieneRecordInput[];
  cleaning_schedule_records: CleaningScheduleRecordInput[];
  immunisation_records: ImmunisationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type InfectionPreventionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface InfectionPreventionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface InfectionPreventionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface InfectionPreventionResult {
  infection_rating: InfectionPreventionRating;
  infection_score: number;
  headline: string;
  total_audits: number;
  total_outbreaks: number;
  total_hand_hygiene_observations: number;
  total_cleaning_records: number;
  total_immunisation_records: number;
  hygiene_audit_compliance_rate: number;
  outbreak_management_rate: number;
  hand_hygiene_rate: number;
  cleaning_compliance_rate: number;
  immunisation_coverage_rate: number;
  staff_training_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: InfectionPreventionRecommendation[];
  insights: InfectionPreventionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): InfectionPreventionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: InfectionPreventionRating,
  score: number,
  headline: string,
): InfectionPreventionResult {
  return {
    infection_rating: rating,
    infection_score: score,
    headline,
    total_audits: 0,
    total_outbreaks: 0,
    total_hand_hygiene_observations: 0,
    total_cleaning_records: 0,
    total_immunisation_records: 0,
    hygiene_audit_compliance_rate: 0,
    outbreak_management_rate: 0,
    hand_hygiene_rate: 0,
    cleaning_compliance_rate: 0,
    immunisation_coverage_rate: 0,
    staff_training_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeInfectionPreventionControl(
  input: InfectionPreventionInput,
): InfectionPreventionResult {
  const {
    total_children,
    hygiene_audit_records,
    illness_outbreak_records,
    hand_hygiene_records,
    cleaning_schedule_records,
    immunisation_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    hygiene_audit_records.length === 0 &&
    illness_outbreak_records.length === 0 &&
    hand_hygiene_records.length === 0 &&
    cleaning_schedule_records.length === 0 &&
    immunisation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess infection prevention and control.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No infection prevention and control data recorded despite children on placement — infection control requires urgent attention.",
      ),
      concerns: [
        "No hygiene audits, outbreak records, hand hygiene observations, cleaning schedules, or immunisation records exist despite children being on placement — the home cannot evidence adequate infection prevention and control measures.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of hygiene audits, hand hygiene observations, cleaning schedules, outbreak management, and immunisation tracking to evidence the home's infection prevention and control framework.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all children have up-to-date immunisation records and that hygiene audit schedules are established with regular hand hygiene monitoring and documented cleaning protocols.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
      ],
      insights: [
        {
          text: "The complete absence of infection prevention and control records means Ofsted cannot verify that the home is protecting children from preventable illness, maintaining hygiene standards, or managing outbreaks effectively. This represents a fundamental gap in Reg 5, Reg 14, and Reg 25 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Hygiene audit metrics ---
  const totalAudits = hygiene_audit_records.length;

  const auditChecks = [
    (a: HygieneAuditRecordInput) => a.hand_wash_stations_adequate,
    (a: HygieneAuditRecordInput) => a.soap_dispensers_stocked,
    (a: HygieneAuditRecordInput) => a.sanitiser_available,
    (a: HygieneAuditRecordInput) => a.waste_disposal_compliant,
    (a: HygieneAuditRecordInput) => a.laundry_procedures_followed,
    (a: HygieneAuditRecordInput) => a.food_hygiene_compliant,
    (a: HygieneAuditRecordInput) => a.personal_protective_equipment_available,
    (a: HygieneAuditRecordInput) => a.infection_control_signage_displayed,
  ];
  const totalAuditChecksPossible = totalAudits * auditChecks.length;
  let totalAuditChecksPassed = 0;
  for (const rec of hygiene_audit_records) {
    for (const check of auditChecks) {
      if (check(rec)) totalAuditChecksPassed++;
    }
  }
  const hygieneAuditComplianceRate = pct(totalAuditChecksPassed, totalAuditChecksPossible);

  const auditIssuesIdentified = hygiene_audit_records.filter(
    (a) => a.issues_identified.length > 0,
  ).length;
  const auditIssuesResolved = hygiene_audit_records.filter(
    (a) => a.issues_identified.length > 0 && a.issues_resolved,
  ).length;
  const auditIssueResolutionRate = pct(auditIssuesResolved, auditIssuesIdentified);

  const auditScoreSum = hygiene_audit_records.reduce(
    (sum, a) => sum + a.overall_compliance_score,
    0,
  );
  const avgAuditScore =
    totalAudits > 0
      ? Math.round((auditScoreSum / totalAudits) * 100) / 100
      : 0;

  const auditsWithCorrectiveActions = hygiene_audit_records.filter(
    (a) => a.corrective_actions !== null && a.corrective_actions !== "",
  ).length;

  // --- Illness outbreak metrics ---
  const totalOutbreaks = illness_outbreak_records.length;

  const outbreaksWithIsolation = illness_outbreak_records.filter(
    (o) => o.isolation_measures_implemented,
  ).length;
  const isolationRate = pct(outbreaksWithIsolation, totalOutbreaks);

  const outbreaksWithGP = illness_outbreak_records.filter(
    (o) => o.gp_consulted,
  ).length;
  const gpConsultationRate = pct(outbreaksWithGP, totalOutbreaks);

  const outbreaksContained = illness_outbreak_records.filter(
    (o) => o.containment_effective,
  ).length;
  const containmentEffectivenessRate = pct(outbreaksContained, totalOutbreaks);

  const outbreaksWithLessonsLearned = illness_outbreak_records.filter(
    (o) => o.lessons_learned_documented,
  ).length;
  const lessonsLearnedRate = pct(outbreaksWithLessonsLearned, totalOutbreaks);

  const outbreaksPublicHealthNotified = illness_outbreak_records.filter(
    (o) => o.public_health_notified,
  ).length;
  const publicHealthNotificationRate = pct(outbreaksPublicHealthNotified, totalOutbreaks);

  // Outbreak management composite: isolation + GP + containment + lessons learned
  const outbreakManagementNumerator =
    outbreaksWithIsolation + outbreaksWithGP + outbreaksContained + outbreaksWithLessonsLearned;
  const outbreakManagementDenominator = totalOutbreaks * 4;
  const outbreakManagementRate = pct(outbreakManagementNumerator, outbreakManagementDenominator);

  // Multi-child outbreaks
  const multiChildOutbreaks = illness_outbreak_records.filter(
    (o) => o.children_affected_count > 1,
  ).length;
  const spreadRate = pct(multiChildOutbreaks, totalOutbreaks);

  // --- Hand hygiene metrics ---
  const totalHandHygieneObs = hand_hygiene_records.length;

  const handHygienePerformed = hand_hygiene_records.filter(
    (h) => h.hand_hygiene_performed,
  ).length;
  const handHygienePerformedRate = pct(handHygienePerformed, totalHandHygieneObs);

  const techniqueCorrect = hand_hygiene_records.filter(
    (h) => h.technique_correct,
  ).length;
  const techniqueCorrectRate = pct(techniqueCorrect, totalHandHygieneObs);

  const soapOrSanitiserUsed = hand_hygiene_records.filter(
    (h) => h.soap_or_sanitiser_used,
  ).length;
  const soapUsageRate = pct(soapOrSanitiserUsed, totalHandHygieneObs);

  const durationAdequate = hand_hygiene_records.filter(
    (h) => h.duration_adequate,
  ).length;
  const durationAdequateRate = pct(durationAdequate, totalHandHygieneObs);

  const glovesUsed = hand_hygiene_records.filter(
    (h) => h.gloves_used_when_required,
  ).length;
  const glovesComplianceRate = pct(glovesUsed, totalHandHygieneObs);

  // Hand hygiene composite: performed + technique + soap + duration
  const handHygieneNumerator =
    handHygienePerformed + techniqueCorrect + soapOrSanitiserUsed + durationAdequate;
  const handHygieneDenominator = totalHandHygieneObs * 4;
  const handHygieneRate = pct(handHygieneNumerator, handHygieneDenominator);

  // Staff training
  const staffTrained = hand_hygiene_records.filter(
    (h) => h.training_completed,
  ).length;
  const staffTrainingRate = pct(staffTrained, totalHandHygieneObs);

  // --- Cleaning schedule metrics ---
  const totalCleaningRecords = cleaning_schedule_records.length;

  const cleaningCompleted = cleaning_schedule_records.filter(
    (c) => c.completed,
  ).length;
  const cleaningCompletionRate = pct(cleaningCompleted, totalCleaningRecords);

  const productsUsedCorrectly = cleaning_schedule_records.filter(
    (c) => c.products_used_correctly,
  ).length;
  const productComplianceRate = pct(productsUsedCorrectly, totalCleaningRecords);

  const checksPerformed = cleaning_schedule_records.filter(
    (c) => c.checked_by !== null && c.checked_by !== "",
  ).length;
  const checkRate = pct(checksPerformed, totalCleaningRecords);

  const checksPassed = cleaning_schedule_records.filter(
    (c) => c.check_passed,
  ).length;
  const checkPassRate = pct(checksPassed, totalCleaningRecords);

  const cleaningIssuesFound = cleaning_schedule_records.filter(
    (c) => c.issues_found !== null && c.issues_found !== "",
  ).length;
  const cleaningIssuesAddressed = cleaning_schedule_records.filter(
    (c) => c.issues_found !== null && c.issues_found !== "" && c.issues_addressed,
  ).length;
  const cleaningIssueResolutionRate = pct(cleaningIssuesAddressed, cleaningIssuesFound);

  // Cleaning compliance composite: completed + products correct + check passed
  const cleaningComplianceNumerator = cleaningCompleted + productsUsedCorrectly + checksPassed;
  const cleaningComplianceDenominator = totalCleaningRecords * 3;
  const cleaningComplianceRate = pct(cleaningComplianceNumerator, cleaningComplianceDenominator);

  // --- Immunisation metrics ---
  const totalImmunisationRecords = immunisation_records.length;

  const immunisationsAdministered = immunisation_records.filter(
    (i) => i.administered,
  ).length;
  const immunisationAdministeredRate = pct(immunisationsAdministered, totalImmunisationRecords);

  const consentObtained = immunisation_records.filter(
    (i) => i.consent_obtained,
  ).length;
  const consentRate = pct(consentObtained, totalImmunisationRecords);

  const gpConfirmed = immunisation_records.filter(
    (i) => i.gp_confirmed,
  ).length;
  const gpConfirmationRate = pct(gpConfirmed, totalImmunisationRecords);

  const declinedVaccines = immunisation_records.filter(
    (i) => i.declined,
  ).length;
  const declinedRate = pct(declinedVaccines, totalImmunisationRecords);

  const catchUpPlans = immunisation_records.filter(
    (i) => !i.administered && !i.declined && i.catch_up_plan_in_place,
  ).length;
  const outstandingWithoutPlan = immunisation_records.filter(
    (i) => !i.administered && !i.declined,
  ).length;
  const catchUpPlanRate = pct(catchUpPlans, outstandingWithoutPlan);

  // Immunisation coverage: children with up-to-date immunisations
  const uniqueChildrenWithImmunisations = new Set(
    immunisation_records.filter((i) => i.administered).map((i) => i.child_id),
  ).size;
  const immunisationCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithImmunisations, total_children) : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: hygieneAuditComplianceRate (>=90: +4, >=70: +2) ---
  if (hygieneAuditComplianceRate >= 90) score += 4;
  else if (hygieneAuditComplianceRate >= 70) score += 2;

  // --- Bonus 2: outbreakManagementRate (>=90: +4, >=70: +2) ---
  if (outbreakManagementRate >= 90) score += 4;
  else if (outbreakManagementRate >= 70) score += 2;

  // --- Bonus 3: handHygieneRate (>=90: +4, >=70: +2) ---
  if (handHygieneRate >= 90) score += 4;
  else if (handHygieneRate >= 70) score += 2;

  // --- Bonus 4: cleaningComplianceRate (>=90: +3, >=70: +1) ---
  if (cleaningComplianceRate >= 90) score += 3;
  else if (cleaningComplianceRate >= 70) score += 1;

  // --- Bonus 5: immunisationCoverageRate (>=90: +3, >=70: +1) ---
  if (immunisationCoverageRate >= 90) score += 3;
  else if (immunisationCoverageRate >= 70) score += 1;

  // --- Bonus 6: staffTrainingRate (>=90: +3, >=70: +1) ---
  if (staffTrainingRate >= 90) score += 3;
  else if (staffTrainingRate >= 70) score += 1;

  // --- Bonus 7: containmentEffectivenessRate (>=90: +3, >=70: +1) ---
  if (containmentEffectivenessRate >= 90) score += 3;
  else if (containmentEffectivenessRate >= 70) score += 1;

  // --- Bonus 8: auditIssueResolutionRate (>=90: +2, >=70: +1) ---
  if (auditIssueResolutionRate >= 90) score += 2;
  else if (auditIssueResolutionRate >= 70) score += 1;

  // --- Bonus 9: lessonsLearnedRate (>=90: +2, >=70: +1) ---
  if (lessonsLearnedRate >= 90) score += 2;
  else if (lessonsLearnedRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // hygieneAuditComplianceRate < 50 → -5
  if (hygieneAuditComplianceRate < 50 && hygiene_audit_records.length > 0) score -= 5;

  // handHygieneRate < 50 → -5
  if (handHygieneRate < 50 && hand_hygiene_records.length > 0) score -= 5;

  // cleaningComplianceRate < 50 → -5
  if (cleaningComplianceRate < 50 && cleaning_schedule_records.length > 0) score -= 5;

  // spreadRate > 50 → -3 (more than half of outbreaks spread to multiple children)
  if (spreadRate > 50 && illness_outbreak_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const infection_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (hygieneAuditComplianceRate >= 90 && totalAudits > 0) {
    strengths.push(
      `${hygieneAuditComplianceRate}% hygiene audit compliance — the home consistently meets infection control standards across hand washing, waste disposal, food hygiene, PPE, and laundry procedures.`,
    );
  } else if (hygieneAuditComplianceRate >= 70 && totalAudits > 0) {
    strengths.push(
      `${hygieneAuditComplianceRate}% hygiene audit compliance — the home generally maintains good infection control standards across audited areas.`,
    );
  }

  if (outbreakManagementRate >= 90 && totalOutbreaks > 0) {
    strengths.push(
      `${outbreakManagementRate}% outbreak management effectiveness — outbreaks are managed with isolation measures, GP consultation, effective containment, and documented lessons learned.`,
    );
  } else if (outbreakManagementRate >= 70 && totalOutbreaks > 0) {
    strengths.push(
      `${outbreakManagementRate}% outbreak management — the home generally manages illness outbreaks effectively with appropriate responses.`,
    );
  }

  if (handHygieneRate >= 90 && totalHandHygieneObs > 0) {
    strengths.push(
      `${handHygieneRate}% hand hygiene compliance — staff consistently perform hand hygiene with correct technique, appropriate products, and adequate duration.`,
    );
  } else if (handHygieneRate >= 70 && totalHandHygieneObs > 0) {
    strengths.push(
      `${handHygieneRate}% hand hygiene compliance — the majority of staff hand hygiene observations meet expected standards.`,
    );
  }

  if (cleaningComplianceRate >= 90 && totalCleaningRecords > 0) {
    strengths.push(
      `${cleaningComplianceRate}% cleaning compliance — cleaning schedules are completed consistently with correct products and verified by supervisors.`,
    );
  } else if (cleaningComplianceRate >= 70 && totalCleaningRecords > 0) {
    strengths.push(
      `${cleaningComplianceRate}% cleaning compliance — cleaning tasks are generally completed to standard with appropriate verification.`,
    );
  }

  if (immunisationCoverageRate >= 90 && total_children > 0 && totalImmunisationRecords > 0) {
    strengths.push(
      `${immunisationCoverageRate}% immunisation coverage — the vast majority of children have up-to-date immunisation records, protecting both individual children and the home community.`,
    );
  } else if (immunisationCoverageRate >= 70 && total_children > 0 && totalImmunisationRecords > 0) {
    strengths.push(
      `${immunisationCoverageRate}% immunisation coverage — most children on placement have received their due immunisations.`,
    );
  }

  if (staffTrainingRate >= 90 && totalHandHygieneObs > 0) {
    strengths.push(
      `${staffTrainingRate}% staff infection control training completion — staff are well trained in hygiene procedures, ensuring consistent practice across the home.`,
    );
  } else if (staffTrainingRate >= 70 && totalHandHygieneObs > 0) {
    strengths.push(
      `${staffTrainingRate}% staff training completion — the majority of staff have completed infection control training.`,
    );
  }

  if (containmentEffectivenessRate >= 90 && totalOutbreaks > 0) {
    strengths.push(
      `${containmentEffectivenessRate}% outbreak containment effectiveness — the home's containment measures successfully prevent illness spread, demonstrating robust infection control protocols.`,
    );
  } else if (containmentEffectivenessRate >= 70 && totalOutbreaks > 0) {
    strengths.push(
      `${containmentEffectivenessRate}% outbreak containment — the home generally succeeds in containing illness outbreaks when they occur.`,
    );
  }

  if (auditIssueResolutionRate >= 90 && auditIssuesIdentified > 0) {
    strengths.push(
      `${auditIssueResolutionRate}% of hygiene audit issues resolved — identified problems are promptly addressed, demonstrating a proactive approach to maintaining hygiene standards.`,
    );
  } else if (auditIssueResolutionRate >= 70 && auditIssuesIdentified > 0) {
    strengths.push(
      `${auditIssueResolutionRate}% of audit issues resolved — the home generally addresses hygiene issues identified during audits.`,
    );
  }

  if (lessonsLearnedRate >= 90 && totalOutbreaks > 0) {
    strengths.push(
      `${lessonsLearnedRate}% of outbreaks have documented lessons learned — the home actively learns from illness events to improve future prevention and response.`,
    );
  } else if (lessonsLearnedRate >= 70 && totalOutbreaks > 0) {
    strengths.push(
      `${lessonsLearnedRate}% lessons learned documentation — the home generally documents learning from outbreak events.`,
    );
  }

  if (isolationRate >= 90 && totalOutbreaks > 0) {
    strengths.push(
      `${isolationRate}% of outbreaks have isolation measures in place — the home consistently implements isolation protocols to protect other children and staff.`,
    );
  }

  if (gpConsultationRate >= 90 && totalOutbreaks > 0) {
    strengths.push(
      `${gpConsultationRate}% GP consultation during outbreaks — the home consistently seeks medical advice during illness events, ensuring children receive appropriate healthcare.`,
    );
  }

  if (cleaningCompletionRate >= 95 && totalCleaningRecords > 0) {
    strengths.push(
      `${cleaningCompletionRate}% cleaning schedule completion — the home maintains an exemplary cleaning regime with near-complete adherence to scheduled tasks.`,
    );
  }

  if (consentRate >= 90 && totalImmunisationRecords > 0) {
    strengths.push(
      `${consentRate}% immunisation consent obtained — the home diligently secures appropriate consent for children's vaccinations, working effectively with those with parental responsibility.`,
    );
  }

  if (techniqueCorrectRate >= 90 && totalHandHygieneObs > 0) {
    strengths.push(
      `${techniqueCorrectRate}% correct hand hygiene technique — staff demonstrate consistently high-quality hand washing and sanitising practice.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (hygieneAuditComplianceRate < 50 && totalAudits > 0) {
    concerns.push(
      `Only ${hygieneAuditComplianceRate}% hygiene audit compliance — more than half of infection control checks are failing, placing children at increased risk of preventable illness and representing a significant Reg 25 concern.`,
    );
  } else if (hygieneAuditComplianceRate < 70 && hygieneAuditComplianceRate >= 50 && totalAudits > 0) {
    concerns.push(
      `Hygiene audit compliance at ${hygieneAuditComplianceRate}% — infection control standards are inconsistently met, with notable gaps in key areas.`,
    );
  }

  if (handHygieneRate < 50 && totalHandHygieneObs > 0) {
    concerns.push(
      `Only ${handHygieneRate}% hand hygiene compliance — the majority of staff hand hygiene observations do not meet expected standards, creating a serious infection risk for children and staff.`,
    );
  } else if (handHygieneRate < 70 && handHygieneRate >= 50 && totalHandHygieneObs > 0) {
    concerns.push(
      `Hand hygiene compliance at ${handHygieneRate}% — staff hand hygiene practice is inconsistent and requires improvement to protect children from infection.`,
    );
  }

  if (cleaningComplianceRate < 50 && totalCleaningRecords > 0) {
    concerns.push(
      `Only ${cleaningComplianceRate}% cleaning compliance — cleaning schedules are not being followed, products are not used correctly, or supervisory checks are failing, compromising the cleanliness and safety of the home environment.`,
    );
  } else if (cleaningComplianceRate < 70 && cleaningComplianceRate >= 50 && totalCleaningRecords > 0) {
    concerns.push(
      `Cleaning compliance at ${cleaningComplianceRate}% — cleaning standards are inconsistent and require improvement to maintain a safe, hygienic environment.`,
    );
  }

  if (outbreakManagementRate < 50 && totalOutbreaks > 0) {
    concerns.push(
      `Only ${outbreakManagementRate}% outbreak management effectiveness — illness outbreaks are not being managed with appropriate isolation, medical consultation, containment, or documented learning, placing children at risk.`,
    );
  } else if (outbreakManagementRate < 70 && outbreakManagementRate >= 50 && totalOutbreaks > 0) {
    concerns.push(
      `Outbreak management at ${outbreakManagementRate}% — the home's response to illness outbreaks is inconsistent, with gaps in isolation, consultation, or containment.`,
    );
  }

  if (immunisationCoverageRate < 50 && total_children > 0 && totalImmunisationRecords > 0) {
    concerns.push(
      `Only ${immunisationCoverageRate}% immunisation coverage — more than half of children on placement do not have up-to-date immunisation records, leaving them vulnerable to preventable diseases.`,
    );
  } else if (immunisationCoverageRate < 70 && immunisationCoverageRate >= 50 && total_children > 0 && totalImmunisationRecords > 0) {
    concerns.push(
      `Immunisation coverage at ${immunisationCoverageRate}% — a significant number of children are not fully immunised, requiring urgent catch-up planning.`,
    );
  }

  if (staffTrainingRate < 50 && totalHandHygieneObs > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% staff infection control training — the majority of staff have not completed infection control training, undermining the home's ability to maintain consistent hygiene practices.`,
    );
  } else if (staffTrainingRate < 70 && staffTrainingRate >= 50 && totalHandHygieneObs > 0) {
    concerns.push(
      `Staff training rate at ${staffTrainingRate}% — a notable proportion of staff have not completed infection control training.`,
    );
  }

  if (spreadRate > 50 && totalOutbreaks > 0) {
    concerns.push(
      `${spreadRate}% of outbreaks affected multiple children — illness is spreading between children, indicating containment measures are insufficient or not implemented quickly enough.`,
    );
  } else if (spreadRate > 30 && spreadRate <= 50 && totalOutbreaks > 0) {
    concerns.push(
      `${spreadRate}% of outbreaks affected multiple children — some illness spread is occurring, suggesting containment protocols should be reviewed.`,
    );
  }

  if (containmentEffectivenessRate < 50 && totalOutbreaks > 0) {
    concerns.push(
      `Only ${containmentEffectivenessRate}% outbreak containment effectiveness — containment measures are not successfully controlling illness spread in the home.`,
    );
  } else if (containmentEffectivenessRate < 70 && containmentEffectivenessRate >= 50 && totalOutbreaks > 0) {
    concerns.push(
      `Outbreak containment at ${containmentEffectivenessRate}% — containment measures are partially effective but need strengthening to better protect children.`,
    );
  }

  if (auditIssueResolutionRate < 50 && auditIssuesIdentified > 0) {
    concerns.push(
      `Only ${auditIssueResolutionRate}% of hygiene audit issues resolved — identified problems with infection control standards persist without remediation.`,
    );
  }

  if (lessonsLearnedRate < 50 && totalOutbreaks > 0) {
    concerns.push(
      `Only ${lessonsLearnedRate}% of outbreaks have documented lessons learned — the home is not systematically learning from illness events, risking repeated failures.`,
    );
  }

  if (cleaningCompletionRate < 70 && totalCleaningRecords > 0) {
    concerns.push(
      `Cleaning completion rate at only ${cleaningCompletionRate}% — scheduled cleaning tasks are not being completed, creating hygiene gaps across the home.`,
    );
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No hygiene audit records exist despite children being on placement — the home cannot evidence that infection control standards are being monitored through structured auditing.",
    );
  }

  if (totalHandHygieneObs === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No hand hygiene observations recorded — the home cannot evidence that staff hand hygiene compliance is being monitored or maintained.",
    );
  }

  if (totalCleaningRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No cleaning schedule records exist — the home cannot evidence that cleaning protocols are being followed or that the environment meets hygiene standards.",
    );
  }

  if (totalImmunisationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No immunisation records exist for children on placement — the home cannot evidence that children's immunisation status is being tracked or that catch-up plans are in place.",
    );
  }

  if (catchUpPlanRate < 50 && outstandingWithoutPlan > 0) {
    concerns.push(
      `Only ${catchUpPlanRate}% of children with outstanding immunisations have catch-up plans — children are falling behind on vaccinations without structured plans to bring them up to date.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: InfectionPreventionRecommendation[] = [];
  let rank = 0;

  if (hygieneAuditComplianceRate < 50 && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address failing hygiene audit standards — review all infection control measures including hand washing stations, waste disposal, food hygiene, PPE, and laundry procedures. Implement corrective actions with assigned accountability and target dates.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (handHygieneRate < 50 && totalHandHygieneObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide urgent hand hygiene retraining for all staff — poor hand hygiene is the single largest contributor to infection spread in care settings. Implement observed practice sessions and increase monitoring frequency.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (cleaningComplianceRate < 50 && totalCleaningRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul cleaning protocols and schedules — ensure all areas have documented cleaning schedules, staff are trained in correct product usage, and supervisory checks verify cleaning standards are met.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (outbreakManagementRate < 50 && totalOutbreaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust outbreak management protocol — ensure isolation measures are activated immediately, GPs are consulted for all illness events, containment is monitored, and lessons are documented to prevent recurrence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (immunisationCoverageRate < 50 && total_children > 0 && totalImmunisationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review immunisation records for all children on placement — liaise with GPs to confirm vaccination status and implement catch-up plans for any children whose immunisations are not up to date.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (staffTrainingRate < 50 && totalHandHygieneObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate infection control training for all staff — untrained staff represent a significant infection risk. Implement a training programme with refresher schedules and competency assessments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (spreadRate > 50 && totalOutbreaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen containment protocols — more than half of outbreaks are spreading between children, indicating systemic failures in isolation and infection control. Consider environmental deep cleaning and enhanced monitoring during illness events.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured hygiene auditing with immediate effect — establish a regular audit schedule covering all areas of infection control with documented findings, corrective actions, and follow-up verification.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalHandHygieneObs === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording hand hygiene observations for all staff — without monitoring, the home cannot evidence hand hygiene compliance or identify training needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalCleaningRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish documented cleaning schedules for every area of the home — without cleaning records, the home cannot evidence that hygiene standards are maintained.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalImmunisationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence immunisation tracking for every child on placement — contact GPs to obtain vaccination histories and ensure all due immunisations are scheduled or catch-up plans are in place.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (auditIssueResolutionRate < 50 && auditIssuesIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a hygiene audit issue tracker with assigned responsibility and target resolution dates — unresolved audit findings indicate systemic failures in infection control maintenance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (lessonsLearnedRate < 50 && totalOutbreaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a post-outbreak debrief process to document lessons learned from every illness event — systematic learning from outbreaks is essential for continuous improvement in infection prevention.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (catchUpPlanRate < 50 && outstandingWithoutPlan > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create catch-up immunisation plans for all children with outstanding vaccinations — liaise with GPs and those with parental responsibility to ensure children receive timely protection.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    hygieneAuditComplianceRate >= 50 &&
    hygieneAuditComplianceRate < 70 &&
    totalAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hygiene audit compliance to at least 70% — target specific areas of non-compliance and provide staff with clear guidance on infection control expectations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    handHygieneRate >= 50 &&
    handHygieneRate < 70 &&
    totalHandHygieneObs > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance hand hygiene training and monitoring — focus on correct technique, adequate duration, and appropriate use of soap or sanitiser to raise compliance above 70%.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    cleaningComplianceRate >= 50 &&
    cleaningComplianceRate < 70 &&
    totalCleaningRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review cleaning protocols and increase supervisory checks — ensure cleaning products are used correctly and all scheduled tasks are completed to a verifiable standard.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    immunisationCoverageRate >= 50 &&
    immunisationCoverageRate < 70 &&
    total_children > 0 &&
    totalImmunisationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase immunisation coverage by reviewing each child's vaccination record with their GP — develop individualised catch-up plans and track progress towards full coverage.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    staffTrainingRate >= 50 &&
    staffTrainingRate < 70 &&
    totalHandHygieneObs > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend infection control training to all staff who have not yet completed it — schedule training sessions and ensure refresher training is built into the staff development programme.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    outbreakManagementRate >= 50 &&
    outbreakManagementRate < 70 &&
    totalOutbreaks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen outbreak management by ensuring all four components — isolation, GP consultation, containment, and lessons learned — are consistently applied during every illness event.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (cleaningIssueResolutionRate < 70 && cleaningIssuesFound > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address outstanding cleaning issues promptly — unresolved cleaning problems create persistent hygiene risks. Assign clear responsibility for remediation and track completion.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: InfectionPreventionInsight[] = [];

  // -- Critical insights --

  if (hygieneAuditComplianceRate < 50 && totalAudits > 0) {
    insights.push({
      text: `Only ${hygieneAuditComplianceRate}% hygiene audit compliance. Ofsted expects children's homes to maintain rigorous infection control standards. When more than half of hygiene checks fail, children are exposed to avoidable infection risks, and the home's compliance with Reg 25 (Premises) is seriously in question.`,
      severity: "critical",
    });
  }

  if (handHygieneRate < 50 && totalHandHygieneObs > 0) {
    insights.push({
      text: `Only ${handHygieneRate}% hand hygiene compliance. Hand hygiene is the single most effective measure for preventing the spread of infection. When staff compliance falls below 50%, the risk of illness transmission within the home increases dramatically. This requires immediate intervention under Reg 14.`,
      severity: "critical",
    });
  }

  if (cleaningComplianceRate < 50 && totalCleaningRecords > 0) {
    insights.push({
      text: `Only ${cleaningComplianceRate}% cleaning compliance. A home that cannot maintain basic cleaning standards is failing in its duty to provide safe, hygienic premises. This directly undermines Reg 25 and places children's health at risk from environmental contamination.`,
      severity: "critical",
    });
  }

  if (spreadRate > 50 && totalOutbreaks > 0) {
    insights.push({
      text: `${spreadRate}% of outbreaks spread to multiple children. When illness consistently spreads between children, it signals systemic failure in containment protocols. This pattern suggests isolation measures, hygiene practices, or environmental cleaning are inadequate during illness events.`,
      severity: "critical",
    });
  }

  if (outbreakManagementRate < 50 && totalOutbreaks > 0) {
    insights.push({
      text: `Only ${outbreakManagementRate}% outbreak management effectiveness. When illness events are not managed with proper isolation, medical oversight, containment, and systematic learning, children are exposed to prolonged illness and repeated outbreaks. This requires urgent action under Reg 14.`,
      severity: "critical",
    });
  }

  if (immunisationCoverageRate < 50 && total_children > 0 && totalImmunisationRecords > 0) {
    insights.push({
      text: `Only ${immunisationCoverageRate}% immunisation coverage. Low vaccination rates leave children vulnerable to preventable diseases and reduce herd protection within the home. Looked-after children often have fragmented health histories — the home must work proactively with GPs to ensure coverage.`,
      severity: "critical",
    });
  }

  if (staffTrainingRate < 50 && totalHandHygieneObs > 0) {
    insights.push({
      text: `Only ${staffTrainingRate}% staff infection control training completed. Untrained staff cannot be expected to maintain consistent infection prevention practices. This represents a fundamental gap in the home's infection control framework and undermines Reg 5 quality of care.`,
      severity: "critical",
    });
  }

  if (totalAudits === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No hygiene audits recorded despite children being on placement. Without structured auditing, the home has no mechanism to identify, track, or resolve infection control deficiencies. This is a fundamental evidence gap for Reg 25 compliance.",
      severity: "critical",
    });
  }

  if (totalHandHygieneObs === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No hand hygiene observations recorded. Hand hygiene monitoring is a core component of any infection prevention framework. Without observation data, the home cannot evidence that staff practice meets the standards required to protect children.",
      severity: "critical",
    });
  }

  if (totalCleaningRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No cleaning schedule records exist. Without documented cleaning protocols and completion records, the home cannot demonstrate that the environment is being maintained to a hygienic standard. Ofsted will view this as a significant Reg 25 failing.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    hygieneAuditComplianceRate >= 50 &&
    hygieneAuditComplianceRate < 70 &&
    totalAudits > 0
  ) {
    insights.push({
      text: `Hygiene audit compliance at ${hygieneAuditComplianceRate}% — improving but inconsistent. Some infection control standards are not being met across audited areas. Targeted improvement in specific areas could significantly raise overall compliance.`,
      severity: "warning",
    });
  }

  if (
    handHygieneRate >= 50 &&
    handHygieneRate < 70 &&
    totalHandHygieneObs > 0
  ) {
    insights.push({
      text: `Hand hygiene compliance at ${handHygieneRate}% — staff practice is inconsistent. The most common gaps tend to be in technique correctness and adequate duration. Focused refresher training could yield rapid improvement.`,
      severity: "warning",
    });
  }

  if (
    cleaningComplianceRate >= 50 &&
    cleaningComplianceRate < 70 &&
    totalCleaningRecords > 0
  ) {
    insights.push({
      text: `Cleaning compliance at ${cleaningComplianceRate}% — cleaning standards are not consistently met. Gaps may exist in completion, correct product usage, or supervisory verification. A structured improvement plan is needed.`,
      severity: "warning",
    });
  }

  if (
    outbreakManagementRate >= 50 &&
    outbreakManagementRate < 70 &&
    totalOutbreaks > 0
  ) {
    insights.push({
      text: `Outbreak management at ${outbreakManagementRate}% — some components of effective outbreak management are missing. Review whether gaps lie in isolation, GP consultation, containment, or learning documentation.`,
      severity: "warning",
    });
  }

  if (
    immunisationCoverageRate >= 50 &&
    immunisationCoverageRate < 70 &&
    total_children > 0 &&
    totalImmunisationRecords > 0
  ) {
    insights.push({
      text: `Immunisation coverage at ${immunisationCoverageRate}% — a notable gap in children's vaccination protection. Review each child's immunisation record with their GP and develop catch-up plans for those who are not up to date.`,
      severity: "warning",
    });
  }

  if (
    staffTrainingRate >= 50 &&
    staffTrainingRate < 70 &&
    totalHandHygieneObs > 0
  ) {
    insights.push({
      text: `Staff training at ${staffTrainingRate}% — some staff have not completed infection control training. Untrained staff may inadvertently compromise infection prevention efforts through inconsistent practice.`,
      severity: "warning",
    });
  }

  if (
    containmentEffectivenessRate >= 50 &&
    containmentEffectivenessRate < 70 &&
    totalOutbreaks > 0
  ) {
    insights.push({
      text: `Outbreak containment at ${containmentEffectivenessRate}% — containment is partially effective but too many outbreaks are not being fully controlled. Review the speed and rigour of isolation measures and environmental decontamination.`,
      severity: "warning",
    });
  }

  if (
    auditIssueResolutionRate >= 50 &&
    auditIssueResolutionRate < 70 &&
    auditIssuesIdentified > 0
  ) {
    insights.push({
      text: `Audit issue resolution at ${auditIssueResolutionRate}% — not all identified hygiene problems are being resolved. Persistent unresolved issues create ongoing infection risks and undermine the purpose of the audit programme.`,
      severity: "warning",
    });
  }

  if (cleaningCompletionRate >= 70 && cleaningCompletionRate < 90 && totalCleaningRecords > 0) {
    insights.push({
      text: `Cleaning completion at ${cleaningCompletionRate}% — while most tasks are completed, gaps remain. Missed cleaning tasks in high-risk areas such as kitchens and bathrooms can have disproportionate impact on infection risk.`,
      severity: "warning",
    });
  }

  if (catchUpPlanRate < 50 && outstandingWithoutPlan > 0) {
    insights.push({
      text: `Only ${catchUpPlanRate}% of children with outstanding immunisations have catch-up plans. Without structured plans, these children remain unprotected against preventable diseases. The home should work with GPs to establish plans for every outstanding vaccination.`,
      severity: "warning",
    });
  }

  // Outbreak type analysis
  const outbreakTypes: Record<string, number> = {};
  for (const o of illness_outbreak_records) {
    outbreakTypes[o.illness_type] = (outbreakTypes[o.illness_type] ?? 0) + 1;
  }
  const topOutbreakTypes = Object.entries(outbreakTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topOutbreakTypes.length > 0) {
    const formatted = topOutbreakTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common illness types: ${formatted}. Understanding illness patterns enables targeted prevention — recurring types may indicate environmental hygiene gaps, inadequate hand hygiene, or the need for specific immunisation catch-up programmes.`,
      severity: "warning",
    });
  }

  // Cleaning area analysis
  const cleaningAreas: Record<string, { total: number; completed: number }> = {};
  for (const c of cleaning_schedule_records) {
    if (!cleaningAreas[c.cleaning_type]) {
      cleaningAreas[c.cleaning_type] = { total: 0, completed: 0 };
    }
    cleaningAreas[c.cleaning_type].total++;
    if (c.completed) cleaningAreas[c.cleaning_type].completed++;
  }
  const poorCleaningAreas = Object.entries(cleaningAreas)
    .filter(([, v]) => v.total >= 3 && pct(v.completed, v.total) < 70)
    .map(([area, v]) => `${area.replace(/_/g, " ")} (${pct(v.completed, v.total)}%)`)
    .slice(0, 3);
  if (poorCleaningAreas.length > 0) {
    insights.push({
      text: `Low cleaning completion in: ${poorCleaningAreas.join(", ")}. These areas require focused attention to ensure consistent cleaning standards are maintained, particularly in high-traffic or food preparation zones.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (infection_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding infection prevention and control — hygiene audits are comprehensive, hand hygiene compliance is high, cleaning schedules are followed rigorously, outbreak management is effective, and immunisation coverage is strong. This is strong evidence for Reg 5, Reg 14, and Reg 25 compliance and SCCIF health and wellbeing.",
      severity: "positive",
    });
  }

  if (
    hygieneAuditComplianceRate >= 90 &&
    handHygieneRate >= 90 &&
    totalAudits > 0 &&
    totalHandHygieneObs > 0
  ) {
    insights.push({
      text: `${hygieneAuditComplianceRate}% audit compliance with ${handHygieneRate}% hand hygiene — the combination of rigorous environmental standards and excellent staff practice creates a robust infection prevention framework that protects children and staff.`,
      severity: "positive",
    });
  }

  if (
    containmentEffectivenessRate >= 90 &&
    lessonsLearnedRate >= 90 &&
    totalOutbreaks > 0
  ) {
    insights.push({
      text: `${containmentEffectivenessRate}% containment effectiveness with ${lessonsLearnedRate}% lessons documented — the home not only controls outbreaks effectively but systematically learns from each event to strengthen future prevention. This demonstrates a mature infection control culture.`,
      severity: "positive",
    });
  }

  if (
    cleaningComplianceRate >= 90 &&
    totalCleaningRecords > 0
  ) {
    insights.push({
      text: `${cleaningComplianceRate}% cleaning compliance — the home maintains exemplary environmental hygiene with consistent schedule completion, correct product usage, and verified cleaning standards. Clean premises are foundational to infection prevention.`,
      severity: "positive",
    });
  }

  if (
    immunisationCoverageRate >= 90 &&
    total_children > 0 &&
    totalImmunisationRecords > 0
  ) {
    insights.push({
      text: `${immunisationCoverageRate}% immunisation coverage — children in the home are well protected against preventable diseases. High vaccination rates protect individual children and create community immunity within the home. This reflects proactive health management under Reg 14.`,
      severity: "positive",
    });
  }

  if (
    staffTrainingRate >= 90 &&
    handHygieneRate >= 90 &&
    totalHandHygieneObs > 0
  ) {
    insights.push({
      text: `${staffTrainingRate}% staff training with ${handHygieneRate}% hand hygiene compliance — well-trained staff translate knowledge into consistent practice. This investment in training directly reduces infection risk for children.`,
      severity: "positive",
    });
  }

  if (
    cleaningCompletionRate >= 95 &&
    checkPassRate >= 90 &&
    totalCleaningRecords > 0
  ) {
    insights.push({
      text: `${cleaningCompletionRate}% cleaning completion with ${checkPassRate}% verification pass rate — cleaning tasks are not only completed but independently verified to meet standards. This dual-layer approach provides strong assurance of environmental hygiene.`,
      severity: "positive",
    });
  }

  if (
    isolationRate >= 90 &&
    gpConsultationRate >= 90 &&
    totalOutbreaks > 0
  ) {
    insights.push({
      text: `${isolationRate}% isolation implementation with ${gpConsultationRate}% GP consultation — the home responds to illness with both immediate protective measures and appropriate medical oversight, demonstrating comprehensive outbreak management.`,
      severity: "positive",
    });
  }

  if (
    auditIssueResolutionRate >= 90 &&
    auditIssuesIdentified > 0
  ) {
    insights.push({
      text: `${auditIssueResolutionRate}% of hygiene audit issues resolved — the home identifies problems through auditing and follows through with corrective actions. This continuous improvement cycle strengthens infection control over time.`,
      severity: "positive",
    });
  }

  if (
    techniqueCorrectRate >= 90 &&
    durationAdequateRate >= 90 &&
    totalHandHygieneObs > 0
  ) {
    insights.push({
      text: `${techniqueCorrectRate}% correct technique with ${durationAdequateRate}% adequate duration — staff do not just perform hand hygiene but do so effectively. Quality of practice, not just frequency, is what truly reduces infection transmission.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (infection_rating === "outstanding") {
    headline =
      "Outstanding infection prevention and control — hygiene standards are rigorous, outbreak management is effective, hand hygiene compliance is high, cleaning schedules are maintained, and immunisation coverage is strong.";
  } else if (infection_rating === "good") {
    headline = `Good infection prevention and control — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (infection_rating === "adequate") {
    headline = `Adequate infection prevention and control — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are protected from preventable infection.`;
  } else {
    headline = `Infection prevention and control is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children from infection risk.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    infection_rating,
    infection_score: score,
    headline,
    total_audits: totalAudits,
    total_outbreaks: totalOutbreaks,
    total_hand_hygiene_observations: totalHandHygieneObs,
    total_cleaning_records: totalCleaningRecords,
    total_immunisation_records: totalImmunisationRecords,
    hygiene_audit_compliance_rate: hygieneAuditComplianceRate,
    outbreak_management_rate: outbreakManagementRate,
    hand_hygiene_rate: handHygieneRate,
    cleaning_compliance_rate: cleaningComplianceRate,
    immunisation_coverage_rate: immunisationCoverageRate,
    staff_training_rate: staffTrainingRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
