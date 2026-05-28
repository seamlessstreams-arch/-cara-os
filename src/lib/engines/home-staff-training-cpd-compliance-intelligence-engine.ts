// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF TRAINING & CPD COMPLIANCE INTELLIGENCE ENGINE
// Home-level: evaluates staff training and CPD compliance including mandatory
// training completion, CPD record quality, training needs analysis,
// qualification tracking, and professional development planning.
// CHR 2015 Reg 32 (fitness of workers) / Reg 33 (employment of staff).
// SCCIF: "Leadership and management" — Ofsted checks staff are trained,
// qualified, and engaged in continuous professional development.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

/**
 * Mandatory training record — one per staff member per mandatory course.
 * Tracks whether the training is completed, valid, expired, or overdue.
 */
export interface MandatoryTrainingRecordInput {
  id: string;
  staff_id: string;
  course_name: string;
  /** "completed" | "in_progress" | "not_started" | "expired" | "overdue" */
  status: string;
  /** Date training was completed (YYYY-MM-DD or null) */
  completed_date: string | null;
  /** Date training expires (YYYY-MM-DD or null) */
  expiry_date: string | null;
  /** Whether the training is currently valid (not expired) */
  is_valid: boolean;
  /** Whether this course is classified as statutory/mandatory */
  is_mandatory: boolean;
  /** Whether the staff member passed any assessment */
  assessment_passed: boolean;
  /** Hours of training delivered */
  training_hours: number;
  /** Training delivery method: "classroom" | "online" | "blended" | "practical" */
  delivery_method: string;
  /** Quality rating of training provider (1-5 or 0 if not rated) */
  provider_quality_rating: number;
  /** Whether a certificate was issued */
  certificate_issued: boolean;
}

/**
 * CPD record — one per CPD activity per staff member.
 * Tracks professional development activities, hours, and quality.
 */
export interface CpdRecordInput {
  id: string;
  staff_id: string;
  /** "completed" | "in_progress" | "planned" | "overdue" | "cancelled" */
  status: string;
  /** Type of CPD activity: "course" | "workshop" | "conference" | "reading" |
   * "shadowing" | "mentoring" | "research" | "qualification" | "other" */
  activity_type: string;
  /** CPD hours logged */
  cpd_hours: number;
  /** Whether the activity was reflected upon in writing */
  reflection_recorded: boolean;
  /** Whether a certificate or evidence was obtained */
  evidence_obtained: boolean;
  /** Whether the learning was applied to practice */
  learning_applied: boolean;
  /** Whether the activity links to an identified development need */
  linked_to_development_need: boolean;
  /** Quality self-assessment (1-5 or 0 if not assessed) */
  quality_rating: number;
  /** Date of activity (YYYY-MM-DD) */
  activity_date: string;
  /** Whether the CPD was shared with the wider team */
  shared_with_team: boolean;
}

/**
 * Training needs analysis record — one per staff member.
 * Documents identified training gaps and priorities.
 */
export interface TrainingNeedsRecordInput {
  id: string;
  staff_id: string;
  /** Date of the training needs assessment (YYYY-MM-DD) */
  assessment_date: string;
  /** Total number of training needs identified */
  needs_identified: number;
  /** Number of needs that have been addressed */
  needs_addressed: number;
  /** Whether the analysis was conducted with the staff member */
  staff_involved: boolean;
  /** Whether needs are linked to appraisal/supervision */
  linked_to_supervision: boolean;
  /** Whether a training plan was created */
  plan_created: boolean;
  /** Priority level: "high" | "medium" | "low" */
  priority: string;
  /** Whether the needs analysis is current (within last 12 months) */
  is_current: boolean;
  /** Whether specialist training needs were identified */
  specialist_needs_identified: boolean;
  /** Number of specialist needs addressed */
  specialist_needs_addressed: number;
}

/**
 * Qualification record — one per qualification per staff member.
 * Tracks qualifications, registration status, and currency.
 */
export interface QualificationRecordInput {
  id: string;
  staff_id: string;
  /** Qualification name */
  qualification_name: string;
  /** "achieved" | "in_progress" | "expired" | "not_started" | "withdrawn" */
  status: string;
  /** Whether the qualification is relevant to the role */
  role_relevant: boolean;
  /** Level of qualification (e.g. 3, 4, 5, 6, 7) or 0 if N/A */
  level: number;
  /** Whether verification/registration is current */
  registration_current: boolean;
  /** Date achieved or null */
  achieved_date: string | null;
  /** Expiry date or null (for qualifications that expire) */
  expiry_date: string | null;
  /** Whether continuing registration requirements are met */
  cpd_requirements_met: boolean;
  /** Whether the qualification is required for the role */
  is_required: boolean;
  /** Whether evidence/certificate is on file */
  evidence_on_file: boolean;
}

/**
 * Development plan record — one per staff member.
 * Tracks whether staff have active development plans and their quality.
 */
export interface DevelopmentPlanRecordInput {
  id: string;
  staff_id: string;
  /** Whether a development plan exists */
  plan_exists: boolean;
  /** Whether the plan is current (reviewed within expected period) */
  is_current: boolean;
  /** Date the plan was last reviewed (YYYY-MM-DD or null) */
  last_reviewed_date: string | null;
  /** Number of objectives set */
  objectives_set: number;
  /** Number of objectives achieved */
  objectives_achieved: number;
  /** Number of objectives in progress */
  objectives_in_progress: number;
  /** Whether the plan was co-created with the staff member */
  staff_involved: boolean;
  /** Whether the plan links to organisational priorities */
  linked_to_home_priorities: boolean;
  /** Whether the plan includes measurable outcomes */
  measurable_outcomes: boolean;
  /** Whether the plan is linked to supervision/appraisal */
  linked_to_supervision: boolean;
  /** Whether career progression pathways are documented */
  career_pathway_documented: boolean;
  /** Quality rating (1-5 or 0 if not rated) */
  quality_rating: number;
}

/**
 * Main input for the Staff Training & CPD Compliance Intelligence Engine.
 * Uses total_staff (NOT total_children) as this is a staff-focused engine.
 */
export interface StaffTrainingCpdComplianceInput {
  today: string;
  /** Total number of staff — STAFF-focused engine */
  total_staff: number;
  /** Mandatory training records across all staff */
  mandatory_training_records: MandatoryTrainingRecordInput[];
  /** CPD records across all staff */
  cpd_records: CpdRecordInput[];
  /** Training needs analysis records */
  training_needs_records: TrainingNeedsRecordInput[];
  /** Qualification records across all staff */
  qualification_records: QualificationRecordInput[];
  /** Development plan records */
  development_plan_records: DevelopmentPlanRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TrainingComplianceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffTrainingCpdComplianceResult {
  training_rating: TrainingComplianceRating;
  training_score: number;
  headline: string;

  // ── Key Metrics ──────────────────────────────────────────────────────
  mandatory_training_compliance_rate: number;
  cpd_completion_rate: number;
  training_needs_coverage_rate: number;
  qualification_currency_rate: number;
  development_plan_coverage_rate: number;
  training_effectiveness_rate: number;

  // ── Detailed Metrics ─────────────────────────────────────────────────
  mandatory_training_valid_count: number;
  mandatory_training_expired_count: number;
  mandatory_training_overdue_count: number;
  mandatory_training_total: number;
  cpd_total_hours: number;
  cpd_avg_hours_per_staff: number;
  cpd_records_with_reflection: number;
  cpd_records_with_evidence: number;
  cpd_learning_applied_count: number;
  training_needs_total_identified: number;
  training_needs_total_addressed: number;
  qualifications_achieved_count: number;
  qualifications_in_progress_count: number;
  qualifications_expired_count: number;
  development_plans_active_count: number;
  development_plans_current_count: number;
  development_objectives_achievement_rate: number;

  // ── Narrative ────────────────────────────────────────────────────────
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * CRITICAL: pct(0, 0) = 0. Always guard the denominator.
 */
function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function toRating(score: number): TrainingComplianceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

/**
 * Count unique staff IDs in a set of records.
 */
function uniqueStaffCount(records: { staff_id: string }[]): number {
  const set = new Set<string>();
  for (const r of records) {
    if (r.staff_id) set.add(r.staff_id);
  }
  return set.size;
}

/**
 * Check if a date string is in the past relative to today.
 */
function isExpired(dateStr: string | null, today: string): boolean {
  if (!dateStr) return false;
  return dateStr < today;
}

/**
 * Check if a date is within the next N days of today.
 */
function isExpiringSoon(dateStr: string | null, today: string, days: number): boolean {
  if (!dateStr) return false;
  if (dateStr < today) return false; // already expired
  const todayMs = new Date(today).getTime();
  const expiryMs = new Date(dateStr).getTime();
  const diffDays = (expiryMs - todayMs) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

/**
 * Count how many days between two date strings. Returns 0 if either is null.
 */
function daysBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

/**
 * Check if a date is within the last N months of today.
 */
function isWithinMonths(dateStr: string | null, today: string, months: number): boolean {
  if (!dateStr) return false;
  const todayDate = new Date(today);
  const checkDate = new Date(dateStr);
  if (isNaN(todayDate.getTime()) || isNaN(checkDate.getTime())) return false;
  const cutoff = new Date(todayDate);
  cutoff.setMonth(cutoff.getMonth() - months);
  return checkDate >= cutoff && checkDate <= todayDate;
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffTrainingCpdCompliance(
  input: StaffTrainingCpdComplianceInput,
): StaffTrainingCpdComplianceResult {
  const {
    today,
    total_staff,
    mandatory_training_records,
    cpd_records,
    training_needs_records,
    qualification_records,
    development_plan_records,
  } = input;

  // ── Empty result template ────────────────────────────────────────────
  const emptyResult: StaffTrainingCpdComplianceResult = {
    training_rating: "insufficient_data",
    training_score: 0,
    headline: "",
    mandatory_training_compliance_rate: 0,
    cpd_completion_rate: 0,
    training_needs_coverage_rate: 0,
    qualification_currency_rate: 0,
    development_plan_coverage_rate: 0,
    training_effectiveness_rate: 0,
    mandatory_training_valid_count: 0,
    mandatory_training_expired_count: 0,
    mandatory_training_overdue_count: 0,
    mandatory_training_total: 0,
    cpd_total_hours: 0,
    cpd_avg_hours_per_staff: 0,
    cpd_records_with_reflection: 0,
    cpd_records_with_evidence: 0,
    cpd_learning_applied_count: 0,
    training_needs_total_identified: 0,
    training_needs_total_addressed: 0,
    qualifications_achieved_count: 0,
    qualifications_in_progress_count: 0,
    qualifications_expired_count: 0,
    development_plans_active_count: 0,
    development_plans_current_count: 0,
    development_objectives_achievement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };

  // ── Check if ALL arrays are empty ────────────────────────────────────
  const allEmpty =
    mandatory_training_records.length === 0 &&
    cpd_records.length === 0 &&
    training_needs_records.length === 0 &&
    qualification_records.length === 0 &&
    development_plan_records.length === 0;

  // ── Special case: allEmpty + 0 staff = insufficient_data (score 0) ──
  if (allEmpty && total_staff === 0) {
    return {
      ...emptyResult,
      training_rating: "insufficient_data",
      training_score: 0,
      headline: "Insufficient data — no staff recorded and no training or CPD data available for analysis.",
      recommendations: [
        {
          rank: 1,
          recommendation: "Record staff training and CPD data to enable compliance analysis. Reg 32 requires evidence of staff fitness and training.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
      ],
      insights: [
        {
          text: "No staff or training data available. Cannot assess training compliance or CPD engagement.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Special case: allEmpty + staff > 0 = inadequate (score 15) ──────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult,
      training_rating: "inadequate",
      training_score: 15,
      headline: `Inadequate — ${total_staff} staff recorded but no training, CPD, qualification, or development plan data found. Statutory requirements under Reg 32/33 cannot be evidenced.`,
      concerns: [
        `${total_staff} staff member${total_staff > 1 ? "s are" : " is"} recorded but no training records exist — Reg 32 compliance cannot be demonstrated.`,
        "No CPD records found — staff professional development is undocumented.",
        "No training needs analysis records found — training gaps cannot be identified.",
        "No qualification records found — staff qualifications cannot be verified.",
        "No development plan records found — staff development planning is absent.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation: "Immediately establish mandatory training records for all staff to meet Reg 32 requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
        {
          rank: 2,
          recommendation: "Implement a CPD framework and begin recording professional development activities for all staff.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        },
        {
          rank: 3,
          recommendation: "Conduct a training needs analysis for every staff member and create development plans.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        },
        {
          rank: 4,
          recommendation: "Verify and record qualifications for all staff, ensuring evidence is on file.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
      ],
      insights: [
        {
          text: `${total_staff} staff recorded but zero training, CPD, or qualification records. This is a critical compliance gap that Ofsted will flag during inspection.`,
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 1: MANDATORY TRAINING COMPLIANCE RATE
  // ══════════════════════════════════════════════════════════════════════

  const mandatoryRecords = mandatory_training_records.filter(r => r.is_mandatory);
  const totalMandatory = mandatoryRecords.length;

  // Valid = completed + is_valid + not expired
  const mandatoryValid = mandatoryRecords.filter(r =>
    r.status === "completed" && r.is_valid && !isExpired(r.expiry_date, today)
  );
  const mandatoryValidCount = mandatoryValid.length;

  // Expired training
  const mandatoryExpired = mandatoryRecords.filter(r =>
    r.status === "expired" || (r.expiry_date && isExpired(r.expiry_date, today))
  );
  const mandatoryExpiredCount = mandatoryExpired.length;

  // Overdue (not started or overdue status)
  const mandatoryOverdue = mandatoryRecords.filter(r =>
    r.status === "overdue"
  );
  const mandatoryOverdueCount = mandatoryOverdue.length;

  // In progress
  const mandatoryInProgress = mandatoryRecords.filter(r =>
    r.status === "in_progress"
  );
  const mandatoryInProgressCount = mandatoryInProgress.length;

  // Not started
  const mandatoryNotStarted = mandatoryRecords.filter(r =>
    r.status === "not_started"
  );
  const mandatoryNotStartedCount = mandatoryNotStarted.length;

  // Expiring within 30 days
  const mandatoryExpiringSoon = mandatoryRecords.filter(r =>
    r.is_valid && isExpiringSoon(r.expiry_date, today, 30)
  );
  const mandatoryExpiringSoonCount = mandatoryExpiringSoon.length;

  // Compliance rate = valid / total mandatory
  const mandatoryTrainingComplianceRate = pct(mandatoryValidCount, totalMandatory);

  // All training records (not just mandatory) — for total counts
  const allTrainingTotal = mandatory_training_records.length;
  const allTrainingValidCount = mandatory_training_records.filter(r =>
    r.status === "completed" && r.is_valid
  ).length;
  const allTrainingExpiredCount = mandatory_training_records.filter(r =>
    r.status === "expired" || (r.expiry_date && isExpired(r.expiry_date, today))
  ).length;
  const allTrainingOverdueCount = mandatory_training_records.filter(r =>
    r.status === "overdue"
  ).length;

  // Assessment pass rate
  const mandatoryWithAssessment = mandatoryRecords.filter(r => r.status === "completed");
  const mandatoryAssessmentPassed = mandatoryWithAssessment.filter(r => r.assessment_passed).length;
  const assessmentPassRate = pct(mandatoryAssessmentPassed, mandatoryWithAssessment.length);

  // Total training hours
  const totalMandatoryHours = mandatory_training_records.reduce((sum, r) => sum + (r.training_hours || 0), 0);
  const avgMandatoryHoursPerStaff = total_staff > 0 ? totalMandatoryHours / total_staff : 0;

  // Certificate coverage
  const mandatoryWithCertificate = mandatoryRecords.filter(r => r.status === "completed" && r.certificate_issued).length;
  const certificateCoverageRate = pct(mandatoryWithCertificate, mandatoryWithAssessment.length);

  // Provider quality
  const ratedProviders = mandatory_training_records.filter(r => r.provider_quality_rating > 0);
  const avgProviderQuality = ratedProviders.length > 0
    ? ratedProviders.reduce((sum, r) => sum + r.provider_quality_rating, 0) / ratedProviders.length
    : 0;

  // Delivery method diversity
  const deliveryMethods = new Set<string>();
  for (const r of mandatory_training_records) {
    if (r.delivery_method) deliveryMethods.add(r.delivery_method);
  }
  const deliveryMethodCount = deliveryMethods.size;

  // Unique staff with mandatory training
  const staffWithMandatoryTraining = uniqueStaffCount(mandatoryRecords);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 2: CPD COMPLETION RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalCpd = cpd_records.length;
  const completedCpd = cpd_records.filter(r => r.status === "completed").length;
  const inProgressCpd = cpd_records.filter(r => r.status === "in_progress").length;
  const plannedCpd = cpd_records.filter(r => r.status === "planned").length;
  const overdueCpd = cpd_records.filter(r => r.status === "overdue").length;
  const cancelledCpd = cpd_records.filter(r => r.status === "cancelled").length;

  const cpdCompletionRate = pct(completedCpd, totalCpd);

  // CPD hours
  const totalCpdHours = cpd_records.reduce((sum, r) => sum + (r.cpd_hours || 0), 0);
  const completedCpdHours = cpd_records
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + (r.cpd_hours || 0), 0);
  const avgCpdHoursPerStaff = total_staff > 0 ? totalCpdHours / total_staff : 0;

  // CPD quality metrics
  const cpdWithReflection = cpd_records.filter(r => r.status === "completed" && r.reflection_recorded).length;
  const cpdWithEvidence = cpd_records.filter(r => r.status === "completed" && r.evidence_obtained).length;
  const cpdLearningApplied = cpd_records.filter(r => r.status === "completed" && r.learning_applied).length;
  const cpdLinkedToDevelopment = cpd_records.filter(r => r.linked_to_development_need).length;
  const cpdSharedWithTeam = cpd_records.filter(r => r.status === "completed" && r.shared_with_team).length;

  const cpdReflectionRate = pct(cpdWithReflection, completedCpd);
  const cpdEvidenceRate = pct(cpdWithEvidence, completedCpd);
  const cpdLearningAppliedRate = pct(cpdLearningApplied, completedCpd);
  const cpdLinkedRate = pct(cpdLinkedToDevelopment, totalCpd);
  const cpdSharedRate = pct(cpdSharedWithTeam, completedCpd);

  // CPD quality ratings
  const ratedCpd = cpd_records.filter(r => r.quality_rating > 0);
  const avgCpdQuality = ratedCpd.length > 0
    ? ratedCpd.reduce((sum, r) => sum + r.quality_rating, 0) / ratedCpd.length
    : 0;

  // CPD activity type diversity
  const cpdActivityTypes = new Set<string>();
  for (const r of cpd_records) {
    if (r.activity_type) cpdActivityTypes.add(r.activity_type);
  }
  const cpdActivityTypeCount = cpdActivityTypes.size;

  // Unique staff with CPD
  const staffWithCpd = uniqueStaffCount(cpd_records);

  // Recent CPD (last 6 months)
  const recentCpd = cpd_records.filter(r =>
    r.status === "completed" && isWithinMonths(r.activity_date, today, 6)
  ).length;

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 3: TRAINING NEEDS COVERAGE RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalTrainingNeeds = training_needs_records.length;
  const currentTrainingNeeds = training_needs_records.filter(r => r.is_current).length;
  const trainingNeedsCoverageRate = total_staff > 0
    ? pct(currentTrainingNeeds, total_staff)
    : pct(currentTrainingNeeds, totalTrainingNeeds);

  // Training needs detail
  const totalNeedsIdentified = training_needs_records.reduce((sum, r) => sum + (r.needs_identified || 0), 0);
  const totalNeedsAddressed = training_needs_records.reduce((sum, r) => sum + (r.needs_addressed || 0), 0);
  const needsAddressedRate = pct(totalNeedsAddressed, totalNeedsIdentified);

  // Staff involvement in TNA
  const tnaStaffInvolved = training_needs_records.filter(r => r.staff_involved).length;
  const tnaStaffInvolvementRate = pct(tnaStaffInvolved, totalTrainingNeeds);

  // Linked to supervision
  const tnaLinkedToSupervision = training_needs_records.filter(r => r.linked_to_supervision).length;
  const tnaLinkedRate = pct(tnaLinkedToSupervision, totalTrainingNeeds);

  // Plans created
  const tnaPlansCreated = training_needs_records.filter(r => r.plan_created).length;
  const tnaPlanRate = pct(tnaPlansCreated, totalTrainingNeeds);

  // High priority needs
  const highPriorityNeeds = training_needs_records.filter(r => r.priority === "high").length;
  const highPriorityAddressed = training_needs_records
    .filter(r => r.priority === "high")
    .reduce((sum, r) => {
      const ratio = r.needs_identified > 0 ? r.needs_addressed / r.needs_identified : 0;
      return sum + (ratio >= 0.8 ? 1 : 0);
    }, 0);

  // Specialist needs
  const specialistNeedsIdentified = training_needs_records.reduce((sum, r) =>
    sum + (r.specialist_needs_identified ? 1 : 0), 0);
  const specialistNeedsAddressedTotal = training_needs_records.reduce((sum, r) =>
    sum + (r.specialist_needs_addressed || 0), 0);
  const specialistNeedsIdentifiedTotal = training_needs_records.filter(r =>
    r.specialist_needs_identified).length;

  // Unique staff with TNA
  const staffWithTna = uniqueStaffCount(training_needs_records);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 4: QUALIFICATION CURRENCY RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalQualifications = qualification_records.length;

  const achievedQualifications = qualification_records.filter(r => r.status === "achieved").length;
  const inProgressQualifications = qualification_records.filter(r => r.status === "in_progress").length;
  const expiredQualifications = qualification_records.filter(r =>
    r.status === "expired" || (r.expiry_date && isExpired(r.expiry_date, today))
  ).length;
  const withdrawnQualifications = qualification_records.filter(r => r.status === "withdrawn").length;
  const notStartedQualifications = qualification_records.filter(r => r.status === "not_started").length;

  // Currency = achieved + registration current + CPD requirements met
  const currentQualifications = qualification_records.filter(r =>
    r.status === "achieved" && r.registration_current
  ).length;
  const qualificationCurrencyRate = pct(currentQualifications, totalQualifications);

  // Role-relevant qualifications
  const roleRelevantQualifications = qualification_records.filter(r => r.role_relevant).length;
  const roleRelevantAchieved = qualification_records.filter(r =>
    r.role_relevant && r.status === "achieved"
  ).length;
  const roleRelevantRate = pct(roleRelevantAchieved, roleRelevantQualifications);

  // Required qualifications
  const requiredQualifications = qualification_records.filter(r => r.is_required).length;
  const requiredAchieved = qualification_records.filter(r =>
    r.is_required && r.status === "achieved"
  ).length;
  const requiredQualificationRate = pct(requiredAchieved, requiredQualifications);

  // CPD requirements met for qualifications
  const qualWithCpdReqs = qualification_records.filter(r =>
    r.status === "achieved" && r.cpd_requirements_met
  ).length;
  const qualCpdReqRate = pct(qualWithCpdReqs, achievedQualifications);

  // Evidence on file
  const evidenceOnFile = qualification_records.filter(r => r.evidence_on_file).length;
  const evidenceRate = pct(evidenceOnFile, totalQualifications);

  // Qualification level distribution
  const qualLevels = qualification_records
    .filter(r => r.status === "achieved" && r.level > 0)
    .map(r => r.level);
  const avgQualLevel = qualLevels.length > 0
    ? qualLevels.reduce((sum, l) => sum + l, 0) / qualLevels.length
    : 0;

  // Expiring soon (within 90 days)
  const qualExpiringSoon = qualification_records.filter(r =>
    r.status === "achieved" && isExpiringSoon(r.expiry_date, today, 90)
  ).length;

  // Unique staff with qualifications
  const staffWithQualifications = uniqueStaffCount(qualification_records);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 5: DEVELOPMENT PLAN COVERAGE RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalDevPlans = development_plan_records.length;
  const activePlans = development_plan_records.filter(r => r.plan_exists).length;
  const currentPlans = development_plan_records.filter(r => r.plan_exists && r.is_current).length;
  const developmentPlanCoverageRate = total_staff > 0
    ? pct(currentPlans, total_staff)
    : pct(currentPlans, totalDevPlans);

  // Development plan quality metrics
  const plansStaffInvolved = development_plan_records.filter(r => r.plan_exists && r.staff_involved).length;
  const plansLinkedToHome = development_plan_records.filter(r => r.plan_exists && r.linked_to_home_priorities).length;
  const plansMeasurable = development_plan_records.filter(r => r.plan_exists && r.measurable_outcomes).length;
  const plansLinkedToSupervision = development_plan_records.filter(r => r.plan_exists && r.linked_to_supervision).length;
  const plansWithCareerPathway = development_plan_records.filter(r => r.plan_exists && r.career_pathway_documented).length;

  const planStaffInvolvementRate = pct(plansStaffInvolved, activePlans);
  const planLinkedToHomeRate = pct(plansLinkedToHome, activePlans);
  const planMeasurableRate = pct(plansMeasurable, activePlans);
  const planLinkedToSupervisionRate = pct(plansLinkedToSupervision, activePlans);
  const planCareerPathwayRate = pct(plansWithCareerPathway, activePlans);

  // Objectives
  const totalObjectivesSet = development_plan_records.reduce((sum, r) => sum + (r.objectives_set || 0), 0);
  const totalObjectivesAchieved = development_plan_records.reduce((sum, r) => sum + (r.objectives_achieved || 0), 0);
  const totalObjectivesInProgress = development_plan_records.reduce((sum, r) => sum + (r.objectives_in_progress || 0), 0);
  const developmentObjectivesAchievementRate = pct(totalObjectivesAchieved, totalObjectivesSet);

  // Quality ratings
  const ratedPlans = development_plan_records.filter(r => r.quality_rating > 0);
  const avgPlanQuality = ratedPlans.length > 0
    ? ratedPlans.reduce((sum, r) => sum + r.quality_rating, 0) / ratedPlans.length
    : 0;

  // Stale plans (plan exists but not current)
  const stalePlans = development_plan_records.filter(r => r.plan_exists && !r.is_current).length;

  // Unique staff with dev plans
  const staffWithDevPlans = uniqueStaffCount(development_plan_records);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 6: TRAINING EFFECTIVENESS RATE (composite)
  // ══════════════════════════════════════════════════════════════════════

  // Training effectiveness is a composite of:
  // - Assessment pass rate (from mandatory training)
  // - CPD learning applied rate
  // - CPD reflection rate
  // - Needs addressed rate
  // - Development objectives achievement rate

  const effectivenessComponents: number[] = [];
  if (mandatoryWithAssessment.length > 0) effectivenessComponents.push(assessmentPassRate);
  if (completedCpd > 0) effectivenessComponents.push(cpdLearningAppliedRate);
  if (completedCpd > 0) effectivenessComponents.push(cpdReflectionRate);
  if (totalNeedsIdentified > 0) effectivenessComponents.push(needsAddressedRate);
  if (totalObjectivesSet > 0) effectivenessComponents.push(developmentObjectivesAchievementRate);

  const trainingEffectivenessRate = effectivenessComponents.length > 0
    ? Math.round(effectivenessComponents.reduce((s, v) => s + v, 0) / effectivenessComponents.length)
    : 0;

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — Base 52 + 9 bonus categories (max 28) = max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Bonus 1: Mandatory training compliance (0–4) ─────────────────────
  if (totalMandatory > 0) {
    if (mandatoryTrainingComplianceRate >= 95) score += 4;
    else if (mandatoryTrainingComplianceRate >= 85) score += 3;
    else if (mandatoryTrainingComplianceRate >= 70) score += 2;
    else if (mandatoryTrainingComplianceRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 2: CPD completion (0–4) ────────────────────────────────────
  if (totalCpd > 0) {
    if (cpdCompletionRate >= 90) score += 4;
    else if (cpdCompletionRate >= 75) score += 3;
    else if (cpdCompletionRate >= 60) score += 2;
    else if (cpdCompletionRate >= 40) score += 1;
    // else +0
  }

  // ── Bonus 3: CPD quality (reflection + evidence + applied) (0–3) ────
  if (completedCpd > 0) {
    const qualityAvg = (cpdReflectionRate + cpdEvidenceRate + cpdLearningAppliedRate) / 3;
    if (qualityAvg >= 80) score += 3;
    else if (qualityAvg >= 60) score += 2;
    else if (qualityAvg >= 40) score += 1;
    // else +0
  }

  // ── Bonus 4: Training needs coverage (0–3) ──────────────────────────
  if (total_staff > 0) {
    if (trainingNeedsCoverageRate >= 90) score += 3;
    else if (trainingNeedsCoverageRate >= 70) score += 2;
    else if (trainingNeedsCoverageRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 5: Training needs addressed (0–3) ─────────────────────────
  if (totalNeedsIdentified > 0) {
    if (needsAddressedRate >= 85) score += 3;
    else if (needsAddressedRate >= 65) score += 2;
    else if (needsAddressedRate >= 45) score += 1;
    // else +0
  }

  // ── Bonus 6: Qualification currency (0–3) ───────────────────────────
  if (totalQualifications > 0) {
    if (qualificationCurrencyRate >= 90) score += 3;
    else if (qualificationCurrencyRate >= 75) score += 2;
    else if (qualificationCurrencyRate >= 55) score += 1;
    // else +0
  }

  // ── Bonus 7: Development plan coverage (0–3) ────────────────────────
  if (total_staff > 0) {
    if (developmentPlanCoverageRate >= 90) score += 3;
    else if (developmentPlanCoverageRate >= 70) score += 2;
    else if (developmentPlanCoverageRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 8: Development objectives achievement (0–3) ───────────────
  if (totalObjectivesSet > 0) {
    if (developmentObjectivesAchievementRate >= 80) score += 3;
    else if (developmentObjectivesAchievementRate >= 60) score += 2;
    else if (developmentObjectivesAchievementRate >= 40) score += 1;
    // else +0
  }

  // ── Bonus 9: Training effectiveness composite (0–2) ─────────────────
  if (effectivenessComponents.length > 0) {
    if (trainingEffectivenessRate >= 80) score += 2;
    else if (trainingEffectivenessRate >= 60) score += 1;
    // else +0
  }

  // Total bonuses: 4+4+3+3+3+3+3+3+2 = 28. Max score: 52+28 = 80 (outstanding).

  // ══════════════════════════════════════════════════════════════════════
  // PENALTIES (4 penalties, all with denominator guards)
  // ══════════════════════════════════════════════════════════════════════

  // ── Penalty 1: Expired mandatory training ────────────────────────────
  if (totalMandatory > 0) {
    const expiredPct = pct(mandatoryExpiredCount, totalMandatory);
    if (expiredPct >= 30) score -= 10;
    else if (expiredPct >= 15) score -= 6;
    else if (expiredPct >= 5) score -= 3;
  }

  // ── Penalty 2: Overdue CPD ──────────────────────────────────────────
  if (totalCpd > 0) {
    const overduePct = pct(overdueCpd, totalCpd);
    if (overduePct >= 25) score -= 8;
    else if (overduePct >= 10) score -= 4;
    else if (overduePct >= 5) score -= 2;
  }

  // ── Penalty 3: Expired qualifications ────────────────────────────────
  if (totalQualifications > 0) {
    const expiredQualPct = pct(expiredQualifications, totalQualifications);
    if (expiredQualPct >= 25) score -= 8;
    else if (expiredQualPct >= 10) score -= 4;
    else if (expiredQualPct >= 5) score -= 2;
  }

  // ── Penalty 4: Stale development plans ──────────────────────────────
  if (activePlans > 0) {
    const stalePct = pct(stalePlans, activePlans);
    if (stalePct >= 40) score -= 6;
    else if (stalePct >= 20) score -= 3;
    else if (stalePct >= 10) score -= 1;
  }

  // ── Clamp and rate ──────────────────────────────────────────────────
  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (mandatoryTrainingComplianceRate >= 90 && totalMandatory > 0) {
    strengths.push(
      `Mandatory training compliance at ${mandatoryTrainingComplianceRate}% — ${mandatoryValidCount} of ${totalMandatory} mandatory courses are current and valid.`
    );
  }

  if (cpdCompletionRate >= 85 && totalCpd > 0) {
    strengths.push(
      `CPD completion rate is ${cpdCompletionRate}% — strong staff engagement with professional development.`
    );
  }

  if (cpdReflectionRate >= 80 && completedCpd > 0) {
    strengths.push(
      `${cpdReflectionRate}% of completed CPD has reflective practice recorded — evidence of deep learning engagement.`
    );
  }

  if (cpdLearningAppliedRate >= 80 && completedCpd > 0) {
    strengths.push(
      `${cpdLearningAppliedRate}% of completed CPD has been applied to practice — learning is translating into improved care.`
    );
  }

  if (avgCpdHoursPerStaff >= 20 && total_staff > 0) {
    strengths.push(
      `Average CPD hours per staff is ${Math.round(avgCpdHoursPerStaff * 10) / 10} — exceeds expected threshold for continuous professional development.`
    );
  }

  if (trainingNeedsCoverageRate >= 85 && total_staff > 0 && totalTrainingNeeds > 0) {
    strengths.push(
      `Training needs analysis coverage at ${trainingNeedsCoverageRate}% — systematic identification of development requirements.`
    );
  }

  if (needsAddressedRate >= 80 && totalNeedsIdentified > 0) {
    strengths.push(
      `${needsAddressedRate}% of identified training needs have been addressed — responsive training planning.`
    );
  }

  if (qualificationCurrencyRate >= 90 && totalQualifications > 0) {
    strengths.push(
      `Qualification currency at ${qualificationCurrencyRate}% — staff qualifications and registrations are maintained.`
    );
  }

  if (requiredQualificationRate >= 95 && requiredQualifications > 0) {
    strengths.push(
      `${requiredQualificationRate}% of required qualifications are achieved — strong compliance with role requirements.`
    );
  }

  if (developmentPlanCoverageRate >= 85 && total_staff > 0 && totalDevPlans > 0) {
    strengths.push(
      `Development plan coverage at ${developmentPlanCoverageRate}% — most staff have current, active development plans.`
    );
  }

  if (developmentObjectivesAchievementRate >= 75 && totalObjectivesSet > 0) {
    strengths.push(
      `${developmentObjectivesAchievementRate}% of development objectives achieved — staff are meeting their professional targets.`
    );
  }

  if (planStaffInvolvementRate >= 90 && activePlans > 0) {
    strengths.push(
      `${planStaffInvolvementRate}% of development plans were co-created with staff — strong collaborative approach to development.`
    );
  }

  if (planLinkedToHomeRate >= 80 && activePlans > 0) {
    strengths.push(
      `${planLinkedToHomeRate}% of development plans linked to home priorities — strategic alignment of staff development.`
    );
  }

  if (assessmentPassRate >= 95 && mandatoryWithAssessment.length > 0) {
    strengths.push(
      `Training assessment pass rate is ${assessmentPassRate}% — staff are demonstrating competence after training.`
    );
  }

  if (mandatoryExpiredCount === 0 && totalMandatory > 0) {
    strengths.push(
      "No expired mandatory training across the staff team — all courses are within validity."
    );
  }

  if (cpdActivityTypeCount >= 4 && totalCpd > 0) {
    strengths.push(
      `CPD activities span ${cpdActivityTypeCount} different types — diverse approach to professional development.`
    );
  }

  if (cpdSharedRate >= 70 && completedCpd > 0) {
    strengths.push(
      `${cpdSharedRate}% of completed CPD has been shared with the wider team — promoting a learning culture.`
    );
  }

  if (tnaStaffInvolvementRate >= 85 && totalTrainingNeeds > 0) {
    strengths.push(
      `${tnaStaffInvolvementRate}% of training needs analyses involved the staff member — inclusive and collaborative approach.`
    );
  }

  if (evidenceRate >= 90 && totalQualifications > 0) {
    strengths.push(
      `${evidenceRate}% of qualifications have evidence on file — strong record-keeping and verification.`
    );
  }

  if (planCareerPathwayRate >= 70 && activePlans > 0) {
    strengths.push(
      `${planCareerPathwayRate}% of development plans include career progression pathways — investing in staff retention.`
    );
  }

  if (trainingEffectivenessRate >= 80 && effectivenessComponents.length >= 3) {
    strengths.push(
      `Overall training effectiveness rate is ${trainingEffectivenessRate}% — training investment is delivering measurable impact.`
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (mandatoryTrainingComplianceRate < 70 && totalMandatory > 0) {
    concerns.push(
      `Mandatory training compliance is only ${mandatoryTrainingComplianceRate}% — Reg 32 requires evidence that staff are fit and trained. ${totalMandatory - mandatoryValidCount} course${totalMandatory - mandatoryValidCount !== 1 ? "s are" : " is"} non-compliant.`
    );
  }

  if (mandatoryExpiredCount > 0) {
    concerns.push(
      `${mandatoryExpiredCount} mandatory training course${mandatoryExpiredCount > 1 ? "s have" : " has"} expired — immediate renewal required to maintain compliance.`
    );
  }

  if (mandatoryOverdueCount > 0) {
    concerns.push(
      `${mandatoryOverdueCount} mandatory training course${mandatoryOverdueCount > 1 ? "s are" : " is"} overdue — staff are not completing required training on schedule.`
    );
  }

  if (mandatoryExpiringSoonCount > 0) {
    concerns.push(
      `${mandatoryExpiringSoonCount} mandatory course${mandatoryExpiringSoonCount > 1 ? "s" : ""} expiring within 30 days — proactive booking needed to prevent compliance gaps.`
    );
  }

  if (cpdCompletionRate < 50 && totalCpd > 0) {
    concerns.push(
      `CPD completion rate is only ${cpdCompletionRate}% — staff are not engaging adequately with professional development.`
    );
  }

  if (overdueCpd > 0) {
    concerns.push(
      `${overdueCpd} CPD activit${overdueCpd > 1 ? "ies are" : "y is"} overdue — staff are falling behind on their professional development commitments.`
    );
  }

  if (avgCpdHoursPerStaff < 5 && total_staff > 0 && totalCpd > 0) {
    concerns.push(
      `Average CPD hours per staff is only ${Math.round(avgCpdHoursPerStaff * 10) / 10} — well below expected levels for professional development.`
    );
  }

  if (cpdReflectionRate < 40 && completedCpd > 0) {
    concerns.push(
      `Only ${cpdReflectionRate}% of completed CPD includes reflective practice — learning is not being embedded effectively.`
    );
  }

  if (cpdLearningAppliedRate < 40 && completedCpd > 0) {
    concerns.push(
      `Only ${cpdLearningAppliedRate}% of CPD learning has been applied to practice — professional development is not translating into improved care.`
    );
  }

  if (trainingNeedsCoverageRate < 50 && total_staff > 0) {
    concerns.push(
      `Training needs analysis coverage is only ${trainingNeedsCoverageRate}% — most staff do not have a current needs assessment.`
    );
  }

  if (needsAddressedRate < 40 && totalNeedsIdentified > 0) {
    concerns.push(
      `Only ${needsAddressedRate}% of identified training needs have been addressed — significant unmet development requirements.`
    );
  }

  if (highPriorityNeeds > 0 && highPriorityAddressed < highPriorityNeeds) {
    concerns.push(
      `${highPriorityNeeds - highPriorityAddressed} high-priority training need${(highPriorityNeeds - highPriorityAddressed) > 1 ? "s remain" : " remains"} unaddressed — these should be prioritised.`
    );
  }

  if (qualificationCurrencyRate < 60 && totalQualifications > 0) {
    concerns.push(
      `Qualification currency rate is only ${qualificationCurrencyRate}% — staff qualifications or registrations are lapsing.`
    );
  }

  if (expiredQualifications > 0) {
    concerns.push(
      `${expiredQualifications} qualification${expiredQualifications > 1 ? "s have" : " has"} expired — registration and renewal action required.`
    );
  }

  if (requiredQualificationRate < 80 && requiredQualifications > 0) {
    concerns.push(
      `Only ${requiredQualificationRate}% of required qualifications are achieved — ${requiredQualifications - requiredAchieved} staff member${(requiredQualifications - requiredAchieved) > 1 ? "s lack" : " lacks"} required qualifications for their role.`
    );
  }

  if (qualExpiringSoon > 0) {
    concerns.push(
      `${qualExpiringSoon} qualification${qualExpiringSoon > 1 ? "s are" : " is"} expiring within 90 days — renewal action needed.`
    );
  }

  if (developmentPlanCoverageRate < 50 && total_staff > 0) {
    concerns.push(
      `Development plan coverage is only ${developmentPlanCoverageRate}% — most staff do not have a current development plan.`
    );
  }

  if (stalePlans > 0 && activePlans > 0) {
    concerns.push(
      `${stalePlans} development plan${stalePlans > 1 ? "s are" : " is"} no longer current — plans need reviewing and updating.`
    );
  }

  if (developmentObjectivesAchievementRate < 30 && totalObjectivesSet > 0) {
    concerns.push(
      `Only ${developmentObjectivesAchievementRate}% of development objectives achieved — staff are not meeting their professional targets.`
    );
  }

  if (planStaffInvolvementRate < 50 && activePlans > 0) {
    concerns.push(
      `Only ${planStaffInvolvementRate}% of development plans involved the staff member — plans may lack ownership and engagement.`
    );
  }

  if (assessmentPassRate < 70 && mandatoryWithAssessment.length > 0) {
    concerns.push(
      `Training assessment pass rate is only ${assessmentPassRate}% — staff may not be absorbing training content effectively.`
    );
  }

  if (evidenceRate < 60 && totalQualifications > 0) {
    concerns.push(
      `Only ${evidenceRate}% of qualifications have evidence on file — record-keeping and verification needs improvement.`
    );
  }

  if (cancelledCpd > 0 && totalCpd > 0) {
    const cancelledPct = pct(cancelledCpd, totalCpd);
    if (cancelledPct >= 15) {
      concerns.push(
        `${cancelledPct}% of CPD activities have been cancelled — barriers to professional development should be investigated.`
      );
    }
  }

  if (total_staff > 0 && staffWithMandatoryTraining < total_staff && totalMandatory > 0) {
    const uncoveredStaff = total_staff - staffWithMandatoryTraining;
    if (uncoveredStaff > 0) {
      concerns.push(
        `${uncoveredStaff} staff member${uncoveredStaff > 1 ? "s have" : " has"} no mandatory training records — all staff must have training recorded.`
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS (ranked, with urgency + regulatory_ref)
  // ══════════════════════════════════════════════════════════════════════

  const recs: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[] = [];
  let rank = 1;

  // Immediate urgency recommendations
  if (mandatoryExpiredCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Arrange immediate renewal for ${mandatoryExpiredCount} expired mandatory training course${mandatoryExpiredCount > 1 ? "s" : ""} to restore regulatory compliance.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (mandatoryTrainingComplianceRate < 70 && totalMandatory > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Urgently address mandatory training compliance — currently at ${mandatoryTrainingComplianceRate}%. All staff must complete required training under Reg 32.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (mandatoryOverdueCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Prioritise completion of ${mandatoryOverdueCount} overdue mandatory training course${mandatoryOverdueCount > 1 ? "s" : ""}. Create a training calendar with deadlines and accountability.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (expiredQualifications > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Address ${expiredQualifications} expired qualification${expiredQualifications > 1 ? "s" : ""} — ensure registration renewal and continuing professional requirements are met.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (requiredQualificationRate < 80 && requiredQualifications > 0) {
    recs.push({
      rank: rank++,
      recommendation: `${requiredQualifications - requiredAchieved} staff member${(requiredQualifications - requiredAchieved) > 1 ? "s lack" : " lacks"} required qualifications — create a plan for these to be achieved within 12 months.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  // Soon urgency recommendations
  if (overdueCpd > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Follow up on ${overdueCpd} overdue CPD activit${overdueCpd > 1 ? "ies" : "y"} — ensure staff have protected time for professional development.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (trainingNeedsCoverageRate < 70 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Conduct training needs analyses for all staff — coverage currently at ${trainingNeedsCoverageRate}%. TNAs should be completed during supervision.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (needsAddressedRate < 60 && totalNeedsIdentified > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Address identified training needs more promptly — only ${needsAddressedRate}% of ${totalNeedsIdentified} identified needs have been met.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (developmentPlanCoverageRate < 70 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Create or update development plans for all staff — current coverage is ${developmentPlanCoverageRate}%. Every staff member should have a current plan.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (stalePlans > 0 && activePlans > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review and update ${stalePlans} stale development plan${stalePlans > 1 ? "s" : ""} — plans should be reviewed at least quarterly during supervision.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (cpdReflectionRate < 50 && completedCpd > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve reflective practice for CPD — only ${cpdReflectionRate}% of completed activities include reflection. Build reflection templates into CPD recording.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (cpdLearningAppliedRate < 50 && completedCpd > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Strengthen application of CPD learning to practice — only ${cpdLearningAppliedRate}% of CPD has been applied. Use supervision to review implementation.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  // Planned urgency recommendations
  if (mandatoryExpiringSoonCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Book renewal training for ${mandatoryExpiringSoonCount} mandatory course${mandatoryExpiringSoonCount > 1 ? "s" : ""} expiring within 30 days to prevent compliance gaps.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (qualExpiringSoon > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Plan renewal for ${qualExpiringSoon} qualification${qualExpiringSoon > 1 ? "s" : ""} expiring within 90 days — ensure CPD requirements are met for renewal.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (avgCpdHoursPerStaff < 10 && avgCpdHoursPerStaff >= 5 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase CPD hours — average is ${Math.round(avgCpdHoursPerStaff * 10) / 10} hours per staff. Consider structured CPD programmes with protected time.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (cpdSharedRate < 50 && completedCpd > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Encourage CPD sharing — only ${cpdSharedRate}% of completed CPD is shared with the team. Introduce team learning sessions or CPD presentations.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (planCareerPathwayRate < 50 && activePlans > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Include career progression pathways in development plans — only ${planCareerPathwayRate}% currently do. This supports staff retention and motivation.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (planMeasurableRate < 60 && activePlans > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Strengthen development plan quality — only ${planMeasurableRate}% include measurable outcomes. Use SMART objective frameworks.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (evidenceRate < 70 && totalQualifications > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve qualification evidence filing — only ${evidenceRate}% of qualifications have evidence on file. Conduct an audit of staff files.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (deliveryMethodCount < 3 && allTrainingTotal >= 5) {
    recs.push({
      rank: rank++,
      recommendation: `Diversify training delivery methods — currently only ${deliveryMethodCount} method${deliveryMethodCount !== 1 ? "s" : ""} used. Blend classroom, online, and practical approaches for better engagement.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (inProgressQualifications > 0 && inProgressQualifications >= 2) {
    recs.push({
      rank: rank++,
      recommendation: `Support ${inProgressQualifications} staff member${inProgressQualifications > 1 ? "s" : ""} with in-progress qualifications — ensure adequate study time, mentoring, and resources are available.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (tnaLinkedRate < 60 && totalTrainingNeeds > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Strengthen the link between training needs analysis and supervision — only ${tnaLinkedRate}% of TNAs are currently linked. Embed TNA discussion in supervision templates.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHTS (with severity: critical, warning, positive)
  // ══════════════════════════════════════════════════════════════════════

  const insights: { text: string; severity: string }[] = [];

  // ── Critical insights ────────────────────────────────────────────────

  if (mandatoryExpiredCount >= 5 && totalMandatory > 0) {
    insights.push({
      text: `${mandatoryExpiredCount} mandatory training courses have expired across the team. This represents a serious compliance risk — Ofsted will flag this as a significant shortfall during inspection under Reg 32.`,
      severity: "critical",
    });
  } else if (mandatoryExpiredCount >= 3 && totalMandatory > 0) {
    insights.push({
      text: `${mandatoryExpiredCount} mandatory training courses have expired. Multiple expired courses indicate a breakdown in training governance that needs immediate management attention.`,
      severity: "critical",
    });
  } else if (mandatoryExpiredCount > 0) {
    insights.push({
      text: `${mandatoryExpiredCount} mandatory training course${mandatoryExpiredCount > 1 ? "s have" : " has"} expired — prioritise renewal to maintain Reg 32 compliance.`,
      severity: "warning",
    });
  }

  if (mandatoryTrainingComplianceRate < 50 && totalMandatory > 0) {
    insights.push({
      text: `Mandatory training compliance is at ${mandatoryTrainingComplianceRate}% — below the minimum acceptable threshold. This will be flagged as inadequate by Ofsted.`,
      severity: "critical",
    });
  }

  if (expiredQualifications >= 3 && totalQualifications > 0) {
    insights.push({
      text: `${expiredQualifications} qualifications have expired across the team. Staff may be practising without valid registration or qualifications — a serious safeguarding and compliance concern.`,
      severity: "critical",
    });
  } else if (expiredQualifications > 0) {
    insights.push({
      text: `${expiredQualifications} qualification${expiredQualifications > 1 ? "s have" : " has"} expired — renewal action required to ensure staff are appropriately qualified.`,
      severity: "warning",
    });
  }

  if (overdueCpd >= 5 && totalCpd > 0) {
    insights.push({
      text: `${overdueCpd} CPD activities are overdue across the team. This systemic pattern suggests CPD governance needs strengthening — staff may lack protected time for development.`,
      severity: "critical",
    });
  } else if (overdueCpd >= 3 && totalCpd > 0) {
    insights.push({
      text: `${overdueCpd} CPD activities are overdue. A pattern of overdue CPD suggests barriers to professional development that management should investigate.`,
      severity: "critical",
    });
  } else if (overdueCpd > 0) {
    insights.push({
      text: `${overdueCpd} CPD activit${overdueCpd > 1 ? "ies are" : "y is"} overdue — follow up during supervision to support completion.`,
      severity: "warning",
    });
  }

  if (developmentPlanCoverageRate < 30 && total_staff > 0 && totalDevPlans > 0) {
    insights.push({
      text: `Only ${developmentPlanCoverageRate}% of staff have current development plans. Ofsted expects every staff member to have a plan demonstrating investment in their development.`,
      severity: "critical",
    });
  }

  if (requiredQualificationRate < 70 && requiredQualifications >= 3) {
    insights.push({
      text: `Only ${requiredQualificationRate}% of required qualifications are achieved — ${requiredQualifications - requiredAchieved} staff are in roles without the required qualification. This is a significant regulatory concern.`,
      severity: "critical",
    });
  }

  // ── Warning insights ─────────────────────────────────────────────────

  if (mandatoryExpiringSoonCount >= 3) {
    insights.push({
      text: `${mandatoryExpiringSoonCount} mandatory courses are expiring within 30 days. Without proactive booking, compliance will drop significantly.`,
      severity: "warning",
    });
  } else if (mandatoryExpiringSoonCount > 0) {
    insights.push({
      text: `${mandatoryExpiringSoonCount} mandatory course${mandatoryExpiringSoonCount > 1 ? "s are" : " is"} expiring within 30 days — book renewal training promptly.`,
      severity: "warning",
    });
  }

  if (cpdCompletionRate < 60 && totalCpd > 0 && cpdCompletionRate >= 30) {
    insights.push({
      text: `CPD completion rate is ${cpdCompletionRate}%. While some engagement exists, a more structured approach to CPD planning and protected time could improve completion.`,
      severity: "warning",
    });
  }

  if (needsAddressedRate < 50 && totalNeedsIdentified > 0 && needsAddressedRate >= 20) {
    insights.push({
      text: `Only ${needsAddressedRate}% of identified training needs have been addressed. Training needs are being identified but not actioned — review training commissioning processes.`,
      severity: "warning",
    });
  }

  if (stalePlans >= 3 && activePlans > 0) {
    insights.push({
      text: `${stalePlans} development plans are no longer current. Plans should be reviewed quarterly during supervision — consider embedding a review prompt in the supervision template.`,
      severity: "warning",
    });
  } else if (stalePlans > 0 && activePlans > 0) {
    insights.push({
      text: `${stalePlans} development plan${stalePlans > 1 ? "s are" : " is"} no longer current — schedule reviews during the next supervision cycle.`,
      severity: "warning",
    });
  }

  if (qualExpiringSoon >= 2) {
    insights.push({
      text: `${qualExpiringSoon} qualifications are expiring within 90 days. Early renewal planning ensures no gaps in qualified status.`,
      severity: "warning",
    });
  }

  if (tnaStaffInvolvementRate < 60 && totalTrainingNeeds > 0) {
    insights.push({
      text: `Only ${tnaStaffInvolvementRate}% of training needs analyses involved the staff member. Staff engagement in identifying their own development needs improves ownership and outcomes.`,
      severity: "warning",
    });
  }

  if (assessmentPassRate < 80 && assessmentPassRate >= 50 && mandatoryWithAssessment.length > 0) {
    insights.push({
      text: `Training assessment pass rate is ${assessmentPassRate}%. Consider reviewing training quality and whether delivery methods suit all learning styles.`,
      severity: "warning",
    });
  }

  if (cancelledCpd >= 3 && totalCpd > 0) {
    insights.push({
      text: `${cancelledCpd} CPD activities have been cancelled. Investigate whether staffing pressures, cost, or other barriers are preventing professional development.`,
      severity: "warning",
    });
  }

  if (planStaffInvolvementRate < 60 && activePlans >= 3) {
    insights.push({
      text: `Only ${planStaffInvolvementRate}% of development plans were co-created with staff. Plans imposed without staff input risk disengagement — involve staff in setting their own objectives.`,
      severity: "warning",
    });
  }

  // ── Positive insights ────────────────────────────────────────────────

  if (
    mandatoryTrainingComplianceRate >= 90 &&
    cpdCompletionRate >= 80 &&
    qualificationCurrencyRate >= 90 &&
    developmentPlanCoverageRate >= 80 &&
    totalMandatory > 0 &&
    totalCpd > 0 &&
    totalQualifications > 0 &&
    totalDevPlans > 0
  ) {
    insights.push({
      text: `Comprehensive training and CPD position: ${mandatoryTrainingComplianceRate}% mandatory compliance, ${cpdCompletionRate}% CPD completion, ${qualificationCurrencyRate}% qualification currency, ${developmentPlanCoverageRate}% development plan coverage. Well-placed for Ofsted inspection.`,
      severity: "positive",
    });
  }

  if (trainingEffectivenessRate >= 80 && effectivenessComponents.length >= 4) {
    insights.push({
      text: `Training effectiveness rate is ${trainingEffectivenessRate}% across ${effectivenessComponents.length} measures. This indicates training investment is delivering real impact on practice quality.`,
      severity: "positive",
    });
  }

  if (cpdReflectionRate >= 80 && cpdLearningAppliedRate >= 80 && completedCpd > 0) {
    insights.push({
      text: `CPD quality is strong: ${cpdReflectionRate}% includes reflection and ${cpdLearningAppliedRate}% has been applied to practice. This demonstrates a genuine learning culture.`,
      severity: "positive",
    });
  }

  if (needsAddressedRate >= 85 && totalNeedsIdentified > 0 && tnaStaffInvolvementRate >= 85 && totalTrainingNeeds > 0) {
    insights.push({
      text: `Training needs analysis is highly effective: ${needsAddressedRate}% of needs addressed with ${tnaStaffInvolvementRate}% staff involvement. A model of responsive, collaborative training planning.`,
      severity: "positive",
    });
  }

  if (developmentObjectivesAchievementRate >= 80 && totalObjectivesSet >= 5) {
    insights.push({
      text: `${developmentObjectivesAchievementRate}% of development objectives achieved across ${totalObjectivesSet} objectives. Staff are meeting their professional targets consistently.`,
      severity: "positive",
    });
  }

  if (planLinkedToHomeRate >= 80 && planLinkedToSupervisionRate >= 80 && activePlans >= 3) {
    insights.push({
      text: `Development plans are well-integrated: ${planLinkedToHomeRate}% linked to home priorities and ${planLinkedToSupervisionRate}% linked to supervision. Strategic workforce development is embedded.`,
      severity: "positive",
    });
  }

  if (avgCpdHoursPerStaff >= 25 && total_staff > 0) {
    insights.push({
      text: `Average CPD hours per staff is ${Math.round(avgCpdHoursPerStaff)} — significantly above expected levels. The home demonstrates strong commitment to continuous professional development.`,
      severity: "positive",
    });
  }

  if (assessmentPassRate >= 98 && mandatoryWithAssessment.length >= 5) {
    insights.push({
      text: `Training assessment pass rate is ${assessmentPassRate}% across ${mandatoryWithAssessment.length} completed courses. Staff are demonstrating excellent comprehension of training content.`,
      severity: "positive",
    });
  }

  if (certificateCoverageRate >= 95 && mandatoryWithAssessment.length > 0) {
    insights.push({
      text: `${certificateCoverageRate}% of completed mandatory training has certificates on file — excellent evidence management for regulatory inspection.`,
      severity: "positive",
    });
  }

  if (cpdActivityTypeCount >= 5 && totalCpd >= 10) {
    insights.push({
      text: `CPD spans ${cpdActivityTypeCount} different activity types across ${totalCpd} records — a diverse and enriching approach to professional development.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════

  let headline: string;

  if (rating === "outstanding") {
    headline = "Staff training and CPD compliance is outstanding — mandatory training, professional development, qualifications, and development planning all performing strongly.";
  } else if (rating === "good") {
    const issues: string[] = [];
    if (mandatoryExpiredCount > 0) issues.push(`${mandatoryExpiredCount} expired training`);
    if (overdueCpd > 0) issues.push(`${overdueCpd} overdue CPD`);
    if (expiredQualifications > 0) issues.push(`${expiredQualifications} expired qualification${expiredQualifications > 1 ? "s" : ""}`);
    if (stalePlans > 0) issues.push(`${stalePlans} stale plan${stalePlans > 1 ? "s" : ""}`);
    headline = issues.length > 0
      ? `Good overall training and CPD compliance — attention needed on ${issues.join(", ")}.`
      : "Good staff training and CPD compliance — mandatory training, qualifications, and development are maintained across key areas.";
  } else if (rating === "adequate") {
    const gaps: string[] = [];
    if (mandatoryTrainingComplianceRate < 70 && totalMandatory > 0) gaps.push("mandatory training");
    if (cpdCompletionRate < 60 && totalCpd > 0) gaps.push("CPD completion");
    if (qualificationCurrencyRate < 70 && totalQualifications > 0) gaps.push("qualification currency");
    if (developmentPlanCoverageRate < 60 && total_staff > 0) gaps.push("development planning");
    if (trainingNeedsCoverageRate < 60 && total_staff > 0) gaps.push("training needs analysis");
    headline = gaps.length > 0
      ? `Adequate training and CPD compliance — gaps in ${gaps.join(", ")} require focused attention to meet regulatory expectations.`
      : "Adequate staff training and CPD compliance — improvements needed across multiple areas to reach good or outstanding.";
  } else {
    headline = "Staff training and CPD compliance is inadequate — multiple statutory requirements under Reg 32/33 are unmet. Immediate action required to address training, qualification, and development gaps.";
  }

  // ══════════════════════════════════════════════════════════════════════
  // RETURN RESULT
  // ══════════════════════════════════════════════════════════════════════

  return {
    training_rating: rating,
    training_score: score,
    headline,

    // Key metrics
    mandatory_training_compliance_rate: mandatoryTrainingComplianceRate,
    cpd_completion_rate: cpdCompletionRate,
    training_needs_coverage_rate: trainingNeedsCoverageRate,
    qualification_currency_rate: qualificationCurrencyRate,
    development_plan_coverage_rate: developmentPlanCoverageRate,
    training_effectiveness_rate: trainingEffectivenessRate,

    // Detailed metrics
    mandatory_training_valid_count: mandatoryValidCount,
    mandatory_training_expired_count: mandatoryExpiredCount,
    mandatory_training_overdue_count: mandatoryOverdueCount,
    mandatory_training_total: totalMandatory,
    cpd_total_hours: Math.round(totalCpdHours * 10) / 10,
    cpd_avg_hours_per_staff: Math.round(avgCpdHoursPerStaff * 10) / 10,
    cpd_records_with_reflection: cpdWithReflection,
    cpd_records_with_evidence: cpdWithEvidence,
    cpd_learning_applied_count: cpdLearningApplied,
    training_needs_total_identified: totalNeedsIdentified,
    training_needs_total_addressed: totalNeedsAddressed,
    qualifications_achieved_count: achievedQualifications,
    qualifications_in_progress_count: inProgressQualifications,
    qualifications_expired_count: expiredQualifications,
    development_plans_active_count: activePlans,
    development_plans_current_count: currentPlans,
    development_objectives_achievement_rate: developmentObjectivesAchievementRate,

    // Narrative
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
