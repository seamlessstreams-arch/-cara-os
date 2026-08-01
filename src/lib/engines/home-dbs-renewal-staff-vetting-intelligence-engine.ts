// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DBS RENEWAL & STAFF VETTING INTELLIGENCE ENGINE
// Home-level: evaluates DBS and vetting compliance including DBS check currency,
// enhanced DBS coverage, overseas police checks, barred list verification,
// reference verification completeness, and renewal timeliness.
// CHR 2015 Reg 32 (fitness of workers), Reg 33 (employment of staff).
// SCCIF: "Safety" — Ofsted checks staff are properly vetted, DBS-checked,
// and that safer recruitment practices are followed.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

/**
 * DBS check record — one per staff member per DBS check.
 * Tracks DBS check status, type, currency, and renewal timeliness.
 */
export interface DbsCheckRecordInput {
  id: string;
  staff_id: string;
  /** "completed" | "pending" | "expired" | "not_started" | "rejected" */
  status: string;
  /** Date the DBS check was completed (YYYY-MM-DD or null) */
  check_date: string | null;
  /** Date the DBS check expires/requires renewal (YYYY-MM-DD or null) */
  expiry_date: string | null;
  /** DBS certificate number or reference */
  certificate_number: string;
  /** Whether the DBS check is currently valid (not expired) */
  is_valid: boolean;
  /** Whether the DBS is on the update service */
  on_update_service: boolean;
  /** Whether any disclosures/convictions were found */
  disclosures_found: boolean;
  /** Whether a risk assessment was completed for any disclosures */
  risk_assessment_completed: boolean;
  /** Whether the certificate has been seen and verified */
  certificate_verified: boolean;
  /** Date the renewal was initiated (YYYY-MM-DD or null) — for timeliness calc */
  renewal_initiated_date: string | null;
  /** Whether the DBS was processed within acceptable timeframe */
  processed_within_timeframe: boolean;
  /** Date created */
  created_at: string;
}

/**
 * Enhanced DBS record — one per staff member.
 * Tracks whether staff have enhanced DBS checks with barred list checks.
 */
export interface EnhancedDbsRecordInput {
  id: string;
  staff_id: string;
  /** "completed" | "pending" | "expired" | "not_started" */
  status: string;
  /** Date the enhanced DBS check was completed (YYYY-MM-DD or null) */
  check_date: string | null;
  /** Date the enhanced DBS check expires (YYYY-MM-DD or null) */
  expiry_date: string | null;
  /** Whether this is an enhanced check (not just basic/standard) */
  is_enhanced: boolean;
  /** Whether the enhanced check includes barred list check */
  includes_barred_list_check: boolean;
  /** Whether the check is currently valid */
  is_valid: boolean;
  /** Whether the certificate has been verified */
  certificate_verified: boolean;
  /** Whether the staff member is registered on DBS update service */
  on_update_service: boolean;
  /** Last update service status check date (YYYY-MM-DD or null) */
  last_update_check_date: string | null;
  /** Whether the last update service check returned clear */
  update_check_clear: boolean;
  /** Role type the check covers: "regulated_activity" | "other" */
  role_type: string;
  /** Date created */
  created_at: string;
}

/**
 * Overseas police check record — for staff who have lived/worked overseas.
 * Required under safer recruitment for anyone who has been abroad for 3+ months.
 */
export interface OverseasCheckRecordInput {
  id: string;
  staff_id: string;
  /** Country the check relates to */
  country: string;
  /** "completed" | "pending" | "not_available" | "not_started" | "waived" */
  status: string;
  /** Date the overseas check was received (YYYY-MM-DD or null) */
  received_date: string | null;
  /** Whether the check is clear (no concerns) */
  is_clear: boolean;
  /** Whether a risk assessment was completed if issues found */
  risk_assessment_completed: boolean;
  /** Whether the check has been verified as authentic */
  verified: boolean;
  /** Whether a letter of good standing was obtained if police check unavailable */
  letter_of_good_standing: boolean;
  /** Whether the check is current (within expected validity) */
  is_current: boolean;
  /** Date created */
  created_at: string;
}

/**
 * Barred list verification record — one per staff member.
 * Confirms staff are not on children's or adults' barred lists.
 */
export interface BarredListRecordInput {
  id: string;
  staff_id: string;
  /** "completed" | "pending" | "not_started" */
  status: string;
  /** Date the barred list check was completed (YYYY-MM-DD or null) */
  check_date: string | null;
  /** Whether the check confirmed the person is NOT on barred list */
  is_clear: boolean;
  /** Whether the check covered children's barred list */
  children_list_checked: boolean;
  /** Whether the check covered adults' barred list */
  adults_list_checked: boolean;
  /** Whether the check has been verified and signed off */
  verified: boolean;
  /** Whether the check is current (within expected recency) */
  is_current: boolean;
  /** Signed off by (name or ID) */
  signed_off_by: string;
  /** Date created */
  created_at: string;
}

/**
 * Reference verification record — one per reference per staff member.
 * Tracks employment references, character references, and verification quality.
 */
export interface ReferenceVerificationRecordInput {
  id: string;
  staff_id: string;
  /** "completed" | "pending" | "not_started" | "declined" | "in_progress" */
  status: string;
  /** Type: "employment" | "character" | "professional" | "academic" */
  reference_type: string;
  /** Date the reference was received (YYYY-MM-DD or null) */
  received_date: string | null;
  /** Whether the reference has been verified (authenticity checked) */
  verified: boolean;
  /** Whether the reference is satisfactory */
  is_satisfactory: boolean;
  /** Whether any concerns were raised in the reference */
  concerns_raised: boolean;
  /** Whether concerns were followed up */
  concerns_followed_up: boolean;
  /** Whether gaps in employment were explored */
  gaps_explored: boolean;
  /** Whether the reference covers suitability for working with children */
  covers_child_suitability: boolean;
  /** Whether the reference was obtained before start date */
  obtained_before_start: boolean;
  /** Whether the referee was contacted directly (not just written) */
  direct_contact_made: boolean;
  /** Date created */
  created_at: string;
}

/**
 * Main input for the DBS Renewal & Staff Vetting Intelligence Engine.
 * Uses total_staff (NOT total_children) as this is a STAFF-focused engine.
 */
export interface DbsVettingInput {
  today: string;
  /** Total number of staff — STAFF-focused engine */
  total_staff: number;
  /** DBS check records across all staff */
  dbs_check_records: DbsCheckRecordInput[];
  /** Enhanced DBS records across all staff */
  enhanced_dbs_records: EnhancedDbsRecordInput[];
  /** Overseas police check records */
  overseas_check_records: OverseasCheckRecordInput[];
  /** Barred list verification records */
  barred_list_records: BarredListRecordInput[];
  /** Reference verification records */
  reference_verification_records: ReferenceVerificationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DbsVettingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DbsVettingResult {
  vetting_rating: DbsVettingRating;
  vetting_score: number | null;
  headline: string;

  // ── Key Metrics ──────────────────────────────────────────────────────
  dbs_currency_rate: number | null;
  enhanced_dbs_rate: number | null;
  overseas_check_rate: number | null;
  barred_list_rate: number | null;
  reference_verification_rate: number | null;
  renewal_timeliness_rate: number | null;

  // ── Detailed Metrics ─────────────────────────────────────────────────
  dbs_total_records: number;
  dbs_valid_count: number;
  dbs_expired_count: number;
  dbs_pending_count: number;
  dbs_on_update_service_count: number;
  dbs_certificate_verified_count: number;
  dbs_with_disclosures_count: number;
  dbs_risk_assessments_completed: number;
  enhanced_dbs_total: number;
  enhanced_dbs_valid_count: number;
  enhanced_dbs_with_barred_list_count: number;
  enhanced_dbs_expired_count: number;
  overseas_checks_total: number;
  overseas_checks_completed: number;
  overseas_checks_clear: number;
  overseas_checks_pending: number;
  barred_list_total: number;
  barred_list_completed: number;
  barred_list_clear_count: number;
  barred_list_children_checked_count: number;
  barred_list_adults_checked_count: number;
  references_total: number;
  references_completed: number;
  references_verified: number;
  references_satisfactory: number;
  references_with_concerns: number;
  references_concerns_followed_up: number;
  references_obtained_before_start: number;
  staff_with_dbs_coverage: number;
  staff_fully_vetted_count: number;

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

function toRating(score: number): DbsVettingRating {
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

/**
 * Count days between two date strings. Returns 0 if either is null.
 */
function daysBetween(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeDbsRenewalStaffVetting(
  input: DbsVettingInput,
): DbsVettingResult {
  const {
    today,
    total_staff,
    dbs_check_records,
    enhanced_dbs_records,
    overseas_check_records,
    barred_list_records,
    reference_verification_records,
  } = input;

  // ── Empty result template ────────────────────────────────────────────
  const emptyResult: DbsVettingResult = {
    vetting_rating: "insufficient_data",
    vetting_score: 0,
    headline: "",
    dbs_currency_rate: 0,
    enhanced_dbs_rate: 0,
    overseas_check_rate: 0,
    barred_list_rate: 0,
    reference_verification_rate: 0,
    renewal_timeliness_rate: 0,
    dbs_total_records: 0,
    dbs_valid_count: 0,
    dbs_expired_count: 0,
    dbs_pending_count: 0,
    dbs_on_update_service_count: 0,
    dbs_certificate_verified_count: 0,
    dbs_with_disclosures_count: 0,
    dbs_risk_assessments_completed: 0,
    enhanced_dbs_total: 0,
    enhanced_dbs_valid_count: 0,
    enhanced_dbs_with_barred_list_count: 0,
    enhanced_dbs_expired_count: 0,
    overseas_checks_total: 0,
    overseas_checks_completed: 0,
    overseas_checks_clear: 0,
    overseas_checks_pending: 0,
    barred_list_total: 0,
    barred_list_completed: 0,
    barred_list_clear_count: 0,
    barred_list_children_checked_count: 0,
    barred_list_adults_checked_count: 0,
    references_total: 0,
    references_completed: 0,
    references_verified: 0,
    references_satisfactory: 0,
    references_with_concerns: 0,
    references_concerns_followed_up: 0,
    references_obtained_before_start: 0,
    staff_with_dbs_coverage: 0,
    staff_fully_vetted_count: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };

  // ── Check if ALL arrays are empty ────────────────────────────────────
  const allEmpty =
    dbs_check_records.length === 0 &&
    enhanced_dbs_records.length === 0 &&
    overseas_check_records.length === 0 &&
    barred_list_records.length === 0 &&
    reference_verification_records.length === 0;

  // ── Special case: allEmpty + 0 staff = insufficient_data (score 0) ──
  if (allEmpty && total_staff === 0) {
    return {
      ...emptyResult,
      vetting_rating: "insufficient_data",
      vetting_score: 0,
      headline: "Insufficient data — no staff recorded and no DBS or vetting data available for analysis.",
      recommendations: [
        {
          rank: 1,
          recommendation: "Record staff DBS and vetting data to enable compliance analysis. Reg 32 requires evidence that workers are fit and safe to work with children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
      ],
      insights: [
        {
          text: "No staff or vetting data available. Cannot assess DBS compliance or safer recruitment practices.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Special case: allEmpty + staff > 0 = inadequate (score 15) ──────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult,
      vetting_rating: "inadequate",
      vetting_score: 15,
      headline: `Inadequate — ${total_staff} staff recorded but no DBS, enhanced DBS, barred list, overseas check, or reference verification data found. Safer recruitment requirements under Reg 32/33 cannot be evidenced.`,
      concerns: [
        `${total_staff} staff member${total_staff > 1 ? "s are" : " is"} recorded but no DBS check records exist — Reg 32 compliance cannot be demonstrated.`,
        "No enhanced DBS records found — staff working in regulated activity must have enhanced checks with barred list.",
        "No barred list verification records found — children may be at risk from unsuitable adults.",
        "No reference verification records found — safer recruitment requirements are unmet.",
        "No overseas police check records found — staff with overseas history cannot be verified.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation: "Immediately obtain and record DBS checks for all staff to meet Reg 32 safer recruitment requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
        {
          rank: 2,
          recommendation: "Ensure all staff in regulated activity have enhanced DBS checks with barred list verification.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
        {
          rank: 3,
          recommendation: "Complete barred list checks for all staff — this is a statutory requirement for children's home workers.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32",
        },
        {
          rank: 4,
          recommendation: "Obtain and verify employment references for all staff as part of safer recruitment compliance.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        },
      ],
      insights: [
        {
          text: `${total_staff} staff recorded but zero DBS, vetting, or reference records. This is a critical safeguarding and compliance failure that Ofsted will identify as requiring immediate action.`,
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 1: DBS CURRENCY RATE
  // How many staff have a current, valid DBS check?
  // ══════════════════════════════════════════════════════════════════════

  const totalDbs = dbs_check_records.length;

  // Valid = completed + is_valid + not expired
  const dbsValid = dbs_check_records.filter(r =>
    r.status === "completed" && r.is_valid && !isExpired(r.expiry_date, today)
  );
  const dbsValidCount = dbsValid.length;

  // Expired DBS
  const dbsExpired = dbs_check_records.filter(r =>
    r.status === "expired" || (r.expiry_date && isExpired(r.expiry_date, today))
  );
  const dbsExpiredCount = dbsExpired.length;

  // Pending DBS
  const dbsPending = dbs_check_records.filter(r =>
    r.status === "pending"
  );
  const dbsPendingCount = dbsPending.length;

  // Not started DBS
  const dbsNotStarted = dbs_check_records.filter(r =>
    r.status === "not_started"
  );
  const dbsNotStartedCount = dbsNotStarted.length;

  // Rejected DBS
  const dbsRejected = dbs_check_records.filter(r =>
    r.status === "rejected"
  );
  const dbsRejectedCount = dbsRejected.length;

  // DBS on update service
  const dbsOnUpdateService = dbs_check_records.filter(r =>
    r.on_update_service && r.status === "completed"
  );
  const dbsOnUpdateServiceCount = dbsOnUpdateService.length;

  // Certificate verified
  const dbsCertificateVerified = dbs_check_records.filter(r =>
    r.certificate_verified && r.status === "completed"
  );
  const dbsCertificateVerifiedCount = dbsCertificateVerified.length;

  // Disclosures found
  const dbsWithDisclosures = dbs_check_records.filter(r =>
    r.disclosures_found
  );
  const dbsWithDisclosuresCount = dbsWithDisclosures.length;

  // Risk assessments completed for disclosures
  const dbsRiskAssessmentsCompleted = dbs_check_records.filter(r =>
    r.disclosures_found && r.risk_assessment_completed
  ).length;

  // Currency rate = valid DBS / total DBS records
  const dbsCurrencyRate = pct(dbsValidCount, totalDbs);

  // Expiring within 30 days
  const dbsExpiringSoon = dbs_check_records.filter(r =>
    r.is_valid && r.status === "completed" && isExpiringSoon(r.expiry_date, today, 30)
  );
  const dbsExpiringSoonCount = dbsExpiringSoon.length;

  // Expiring within 90 days
  const dbsExpiring90Days = dbs_check_records.filter(r =>
    r.is_valid && r.status === "completed" && isExpiringSoon(r.expiry_date, today, 90)
  );
  const dbsExpiring90DaysCount = dbsExpiring90Days.length;

  // Certificate verification rate
  const dbsCertVerificationRate = pct(dbsCertificateVerifiedCount, totalDbs > 0 ? dbs_check_records.filter(r => r.status === "completed").length : 0);

  // Update service enrolment rate
  const dbsUpdateServiceRate = pct(dbsOnUpdateServiceCount, totalDbs > 0 ? dbs_check_records.filter(r => r.status === "completed").length : 0);

  // Staff coverage — unique staff with ANY DBS record
  const staffWithDbs = uniqueStaffCount(dbs_check_records);

  // Staff with valid DBS
  const staffWithValidDbs = uniqueStaffCount(dbsValid);

  // Risk assessment completion rate for those with disclosures
  const disclosureRiskAssessmentRate = pct(dbsRiskAssessmentsCompleted, dbsWithDisclosuresCount);

  // Processed within timeframe
  const dbsProcessedOnTime = dbs_check_records.filter(r =>
    r.status === "completed" && r.processed_within_timeframe
  ).length;
  const completedDbsCount = dbs_check_records.filter(r => r.status === "completed").length;
  const dbsProcessingTimelinessRate = pct(dbsProcessedOnTime, completedDbsCount);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 2: ENHANCED DBS RATE
  // Staff in regulated activity MUST have enhanced DBS with barred list.
  // ══════════════════════════════════════════════════════════════════════

  const totalEnhanced = enhanced_dbs_records.length;

  // Valid enhanced DBS
  const enhancedValid = enhanced_dbs_records.filter(r =>
    r.status === "completed" && r.is_enhanced && r.is_valid && !isExpired(r.expiry_date, today)
  );
  const enhancedValidCount = enhancedValid.length;

  // Enhanced DBS with barred list check
  const enhancedWithBarredList = enhanced_dbs_records.filter(r =>
    r.status === "completed" && r.is_enhanced && r.includes_barred_list_check
  );
  const enhancedWithBarredListCount = enhancedWithBarredList.length;

  // Expired enhanced DBS
  const enhancedExpired = enhanced_dbs_records.filter(r =>
    r.status === "expired" || (r.expiry_date && isExpired(r.expiry_date, today))
  );
  const enhancedExpiredCount = enhancedExpired.length;

  // Enhanced DBS pending
  const enhancedPending = enhanced_dbs_records.filter(r =>
    r.status === "pending"
  ).length;

  // Enhanced DBS not started
  const enhancedNotStarted = enhanced_dbs_records.filter(r =>
    r.status === "not_started"
  ).length;

  // Certificate verified for enhanced
  const enhancedCertVerified = enhanced_dbs_records.filter(r =>
    r.status === "completed" && r.certificate_verified
  ).length;

  // On update service for enhanced
  const enhancedOnUpdateService = enhanced_dbs_records.filter(r =>
    r.status === "completed" && r.on_update_service
  ).length;

  // Update check performed recently
  const enhancedUpdateChecked = enhanced_dbs_records.filter(r =>
    r.on_update_service && r.last_update_check_date && isWithinMonths(r.last_update_check_date, today, 3)
  ).length;

  // Update checks returned clear
  const enhancedUpdateClear = enhanced_dbs_records.filter(r =>
    r.on_update_service && r.update_check_clear
  ).length;

  // Regulated activity coverage
  const regulatedActivityRecords = enhanced_dbs_records.filter(r =>
    r.role_type === "regulated_activity"
  );
  const regulatedActivityCompleted = regulatedActivityRecords.filter(r =>
    r.status === "completed" && r.is_enhanced && r.includes_barred_list_check
  ).length;
  const regulatedActivityRate = pct(regulatedActivityCompleted, regulatedActivityRecords.length);

  // Enhanced DBS rate = valid enhanced / total enhanced
  const enhancedDbsRate = pct(enhancedValidCount, totalEnhanced);

  // Expiring enhanced DBS
  const enhancedExpiringSoon = enhanced_dbs_records.filter(r =>
    r.is_valid && r.status === "completed" && isExpiringSoon(r.expiry_date, today, 60)
  );
  const enhancedExpiringSoonCount = enhancedExpiringSoon.length;

  // Unique staff with enhanced DBS
  const staffWithEnhancedDbs = uniqueStaffCount(enhanced_dbs_records);
  const staffWithValidEnhancedDbs = uniqueStaffCount(enhancedValid);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 3: OVERSEAS CHECK RATE
  // Overseas police checks for staff who have lived/worked abroad.
  // ══════════════════════════════════════════════════════════════════════

  const totalOverseas = overseas_check_records.length;

  // Completed overseas checks
  const overseasCompleted = overseas_check_records.filter(r =>
    r.status === "completed"
  );
  const overseasCompletedCount = overseasCompleted.length;

  // Clear overseas checks
  const overseasClear = overseas_check_records.filter(r =>
    r.status === "completed" && r.is_clear
  );
  const overseasClearCount = overseasClear.length;

  // Pending overseas checks
  const overseasPending = overseas_check_records.filter(r =>
    r.status === "pending"
  );
  const overseasPendingCount = overseasPending.length;

  // Not available — some countries don't issue police checks
  const overseasNotAvailable = overseas_check_records.filter(r =>
    r.status === "not_available"
  );
  const overseasNotAvailableCount = overseasNotAvailable.length;

  // Not started
  const overseasNotStarted = overseas_check_records.filter(r =>
    r.status === "not_started"
  );
  const overseasNotStartedCount = overseasNotStarted.length;

  // Waived
  const overseasWaived = overseas_check_records.filter(r =>
    r.status === "waived"
  );
  const overseasWaivedCount = overseasWaived.length;

  // Verified overseas checks
  const overseasVerified = overseas_check_records.filter(r =>
    r.status === "completed" && r.verified
  );
  const overseasVerifiedCount = overseasVerified.length;

  // Letter of good standing obtained (for unavailable countries)
  const letterOfGoodStandingCount = overseas_check_records.filter(r =>
    r.status === "not_available" && r.letter_of_good_standing
  ).length;

  // Risk assessments for overseas checks with concerns
  const overseasWithConcerns = overseas_check_records.filter(r =>
    r.status === "completed" && !r.is_clear
  );
  const overseasRiskAssessmentsCompleted = overseasWithConcerns.filter(r =>
    r.risk_assessment_completed
  ).length;

  // Current overseas checks
  const overseasCurrent = overseas_check_records.filter(r =>
    (r.status === "completed" || r.status === "not_available") && r.is_current
  ).length;

  // Overseas check rate — completed or appropriately handled / total
  const overseasHandled = overseasCompletedCount + letterOfGoodStandingCount + overseasWaivedCount;
  const overseasCheckRate = pct(overseasHandled, totalOverseas);

  // Unique staff with overseas checks
  const staffWithOverseasChecks = uniqueStaffCount(overseas_check_records);

  // Countries covered
  const countriesCovered = new Set<string>();
  for (const r of overseas_check_records) {
    if (r.country) countriesCovered.add(r.country);
  }
  const countryCount = countriesCovered.size;

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 4: BARRED LIST RATE
  // Barred list verification for all staff working with children.
  // ══════════════════════════════════════════════════════════════════════

  const totalBarred = barred_list_records.length;

  // Completed barred list checks
  const barredCompleted = barred_list_records.filter(r =>
    r.status === "completed"
  );
  const barredCompletedCount = barredCompleted.length;

  // Clear barred list checks
  const barredClear = barred_list_records.filter(r =>
    r.status === "completed" && r.is_clear
  );
  const barredClearCount = barredClear.length;

  // Children's list checked
  const barredChildrenChecked = barred_list_records.filter(r =>
    r.status === "completed" && r.children_list_checked
  );
  const barredChildrenCheckedCount = barredChildrenChecked.length;

  // Adults' list checked
  const barredAdultsChecked = barred_list_records.filter(r =>
    r.status === "completed" && r.adults_list_checked
  );
  const barredAdultsCheckedCount = barredAdultsChecked.length;

  // Verified and signed off
  const barredVerified = barred_list_records.filter(r =>
    r.status === "completed" && r.verified
  );
  const barredVerifiedCount = barredVerified.length;

  // Current barred list checks
  const barredCurrent = barred_list_records.filter(r =>
    r.status === "completed" && r.is_current
  );
  const barredCurrentCount = barredCurrent.length;

  // Pending barred list checks
  const barredPending = barred_list_records.filter(r =>
    r.status === "pending"
  );
  const barredPendingCount = barredPending.length;

  // Not started
  const barredNotStarted = barred_list_records.filter(r =>
    r.status === "not_started"
  );
  const barredNotStartedCount = barredNotStarted.length;

  // Both lists checked (children + adults)
  const barredBothListsChecked = barred_list_records.filter(r =>
    r.status === "completed" && r.children_list_checked && r.adults_list_checked
  );
  const barredBothListsCheckedCount = barredBothListsChecked.length;

  // Signed off
  const barredSignedOff = barred_list_records.filter(r =>
    r.status === "completed" && r.signed_off_by && r.signed_off_by.length > 0
  ).length;

  // Barred list rate = completed & clear & current / total
  const barredListRate = pct(barredCurrentCount, totalBarred);

  // Unique staff with barred list checks
  const staffWithBarredListChecks = uniqueStaffCount(barred_list_records);

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 5: REFERENCE VERIFICATION RATE
  // Employment and character references, verification quality.
  // ══════════════════════════════════════════════════════════════════════

  const totalRefs = reference_verification_records.length;

  // Completed references
  const refsCompleted = reference_verification_records.filter(r =>
    r.status === "completed"
  );
  const refsCompletedCount = refsCompleted.length;

  // Verified references
  const refsVerified = reference_verification_records.filter(r =>
    r.status === "completed" && r.verified
  );
  const refsVerifiedCount = refsVerified.length;

  // Satisfactory references
  const refsSatisfactory = reference_verification_records.filter(r =>
    r.status === "completed" && r.is_satisfactory
  );
  const refsSatisfactoryCount = refsSatisfactory.length;

  // References with concerns
  const refsWithConcerns = reference_verification_records.filter(r =>
    r.concerns_raised
  );
  const refsWithConcernsCount = refsWithConcerns.length;

  // Concerns followed up
  const refsConcernsFollowedUp = reference_verification_records.filter(r =>
    r.concerns_raised && r.concerns_followed_up
  );
  const refsConcernsFollowedUpCount = refsConcernsFollowedUp.length;

  // Gaps explored
  const refsGapsExplored = reference_verification_records.filter(r =>
    r.status === "completed" && r.gaps_explored
  );
  const refsGapsExploredCount = refsGapsExplored.length;

  // Covers child suitability
  const refsChildSuitability = reference_verification_records.filter(r =>
    r.status === "completed" && r.covers_child_suitability
  );
  const refsChildSuitabilityCount = refsChildSuitability.length;

  // Obtained before start
  const refsBeforeStart = reference_verification_records.filter(r =>
    r.obtained_before_start
  );
  const refsBeforeStartCount = refsBeforeStart.length;

  // Direct contact made
  const refsDirectContact = reference_verification_records.filter(r =>
    r.status === "completed" && r.direct_contact_made
  );
  const refsDirectContactCount = refsDirectContact.length;

  // Pending references
  const refsPending = reference_verification_records.filter(r =>
    r.status === "pending" || r.status === "in_progress"
  );
  const refsPendingCount = refsPending.length;

  // Declined references
  const refsDeclined = reference_verification_records.filter(r =>
    r.status === "declined"
  );
  const refsDeclinedCount = refsDeclined.length;

  // Not started
  const refsNotStarted = reference_verification_records.filter(r =>
    r.status === "not_started"
  );
  const refsNotStartedCount = refsNotStarted.length;

  // Employment references specifically
  const employmentRefs = reference_verification_records.filter(r =>
    r.reference_type === "employment"
  );
  const employmentRefsCompleted = employmentRefs.filter(r => r.status === "completed").length;
  const employmentRefsTotal = employmentRefs.length;

  // Reference verification rate = verified & satisfactory / total refs
  const referenceVerificationRate = pct(refsVerifiedCount, totalRefs);

  // Child suitability rate
  const childSuitabilityRate = pct(refsChildSuitabilityCount, refsCompletedCount);

  // Gaps exploration rate
  const gapsExplorationRate = pct(refsGapsExploredCount, refsCompletedCount);

  // Before start rate
  const beforeStartRate = pct(refsBeforeStartCount, totalRefs);

  // Direct contact rate
  const directContactRate = pct(refsDirectContactCount, refsCompletedCount);

  // Concern follow-up rate
  const concernFollowUpRate = pct(refsConcernsFollowedUpCount, refsWithConcernsCount);

  // Unique staff with references
  const staffWithReferences = uniqueStaffCount(reference_verification_records);

  // Reference type diversity
  const refTypes = new Set<string>();
  for (const r of reference_verification_records) {
    if (r.reference_type) refTypes.add(r.reference_type);
  }
  const refTypeCount = refTypes.size;

  // ══════════════════════════════════════════════════════════════════════
  // METRIC 6: RENEWAL TIMELINESS RATE (composite)
  // How timely are DBS renewals and vetting updates?
  // ══════════════════════════════════════════════════════════════════════

  // Renewal timeliness considers:
  // - DBS processed within timeframe
  // - Enhanced DBS update checks done within 3 months
  // - Barred list checks being current
  // - Overseas checks being current
  // - References obtained before start date

  const timelinessComponents: number[] = [];
  if (completedDbsCount > 0) timelinessComponents.push(dbsProcessingTimelinessRate);
  if (enhancedOnUpdateService > 0) {
    const updateCheckRate = pct(enhancedUpdateChecked, enhancedOnUpdateService);
    timelinessComponents.push(updateCheckRate);
  }
  if (totalBarred > 0) {
    const barredCurrencyRate = pct(barredCurrentCount, barredCompletedCount);
    timelinessComponents.push(barredCurrencyRate);
  }
  if (totalOverseas > 0) {
    const overseasCurrencyRate = pct(overseasCurrent, totalOverseas);
    timelinessComponents.push(overseasCurrencyRate);
  }
  if (totalRefs > 0) timelinessComponents.push(beforeStartRate);

  const renewalTimelinessRate = timelinessComponents.length > 0
    ? Math.round(timelinessComponents.reduce((s, v) => s + v, 0) / timelinessComponents.length)
    : null;

  // ══════════════════════════════════════════════════════════════════════
  // FULLY VETTED STAFF COUNT
  // Staff who have ALL of: valid DBS + enhanced DBS + barred list clear
  // ══════════════════════════════════════════════════════════════════════

  const dbsStaffIds = new Set<string>();
  for (const r of dbsValid) {
    if (r.staff_id) dbsStaffIds.add(r.staff_id);
  }

  const enhancedStaffIds = new Set<string>();
  for (const r of enhancedValid) {
    if (r.staff_id) enhancedStaffIds.add(r.staff_id);
  }

  const barredClearStaffIds = new Set<string>();
  for (const r of barredClear) {
    if (r.staff_id) barredClearStaffIds.add(r.staff_id);
  }

  const refsVerifiedStaffIds = new Set<string>();
  for (const r of refsVerified) {
    if (r.staff_id) refsVerifiedStaffIds.add(r.staff_id);
  }

  let staffFullyVettedCount = 0;
  const allStaffIds = new Set<string>();
  for (const r of dbs_check_records) { if (r.staff_id) allStaffIds.add(r.staff_id); }
  for (const r of enhanced_dbs_records) { if (r.staff_id) allStaffIds.add(r.staff_id); }
  for (const r of barred_list_records) { if (r.staff_id) allStaffIds.add(r.staff_id); }
  for (const r of reference_verification_records) { if (r.staff_id) allStaffIds.add(r.staff_id); }

  Array.from(allStaffIds).forEach(staffId => {
    if (
      dbsStaffIds.has(staffId) &&
      enhancedStaffIds.has(staffId) &&
      barredClearStaffIds.has(staffId) &&
      refsVerifiedStaffIds.has(staffId)
    ) {
      staffFullyVettedCount++;
    }
  });

  const fullyVettedRate = pct(staffFullyVettedCount, total_staff > 0 ? total_staff : allStaffIds.size);

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — Base 52 + 9 bonus categories (max 28) = max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Bonus 1: DBS currency (0–4) ─────────────────────────────────────
  if (totalDbs > 0) {
    if (dbsCurrencyRate >= 95) score += 4;
    else if (dbsCurrencyRate >= 85) score += 3;
    else if (dbsCurrencyRate >= 70) score += 2;
    else if (dbsCurrencyRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 2: Enhanced DBS coverage (0–4) ────────────────────────────
  if (totalEnhanced > 0) {
    if (enhancedDbsRate >= 95) score += 4;
    else if (enhancedDbsRate >= 85) score += 3;
    else if (enhancedDbsRate >= 70) score += 2;
    else if (enhancedDbsRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 3: Barred list verification (0–4) ─────────────────────────
  if (totalBarred > 0) {
    if (barredListRate >= 95) score += 4;
    else if (barredListRate >= 85) score += 3;
    else if (barredListRate >= 70) score += 2;
    else if (barredListRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 4: Reference verification quality (0–3) ──────────────────
  if (totalRefs > 0) {
    if (referenceVerificationRate >= 90) score += 3;
    else if (referenceVerificationRate >= 75) score += 2;
    else if (referenceVerificationRate >= 55) score += 1;
    // else +0
  }

  // ── Bonus 5: Overseas check handling (0–3) ──────────────────────────
  if (totalOverseas > 0) {
    if (overseasCheckRate >= 90) score += 3;
    else if (overseasCheckRate >= 75) score += 2;
    else if (overseasCheckRate >= 55) score += 1;
    // else +0
  }

  // ── Bonus 6: DBS certificate verification (0–3) ────────────────────
  if (completedDbsCount > 0) {
    if (dbsCertVerificationRate >= 95) score += 3;
    else if (dbsCertVerificationRate >= 80) score += 2;
    else if (dbsCertVerificationRate >= 60) score += 1;
    // else +0
  }

  // ── Bonus 7: Reference child suitability coverage (0–3) ────────────
  if (refsCompletedCount > 0) {
    if (childSuitabilityRate >= 90) score += 3;
    else if (childSuitabilityRate >= 70) score += 2;
    else if (childSuitabilityRate >= 50) score += 1;
    // else +0
  }

  // ── Bonus 8: Staff fully vetted coverage (0–2) ─────────────────────
  if (total_staff > 0 || allStaffIds.size > 0) {
    if (fullyVettedRate >= 90) score += 2;
    else if (fullyVettedRate >= 70) score += 1;
    // else +0
  }

  // ── Bonus 9: Renewal timeliness composite (0–2) ────────────────────
  if (timelinessComponents.length > 0) {
    if ((renewalTimelinessRate ?? 0) >= 85) score += 2;
    else if ((renewalTimelinessRate ?? 0) >= 65) score += 1;
    // else +0
  }

  // Total bonuses: 4+4+4+3+3+3+3+2+2 = 28. Max score: 52+28 = 80 (outstanding).

  // ══════════════════════════════════════════════════════════════════════
  // PENALTIES (4 penalties, all guarded by array.length > 0)
  // ══════════════════════════════════════════════════════════════════════

  // ── Penalty 1: Expired DBS checks ──────────────────────────────────
  if (dbs_check_records.length > 0) {
    const expiredPct = pct(dbsExpiredCount, totalDbs);
    if (expiredPct >= 30) score -= 10;
    else if (expiredPct >= 15) score -= 6;
    else if (expiredPct >= 5) score -= 3;
  }

  // ── Penalty 2: Expired enhanced DBS ────────────────────────────────
  if (enhanced_dbs_records.length > 0) {
    const enhExpiredPct = pct(enhancedExpiredCount, totalEnhanced);
    if (enhExpiredPct >= 25) score -= 8;
    else if (enhExpiredPct >= 10) score -= 5;
    else if (enhExpiredPct >= 5) score -= 2;
  }

  // ── Penalty 3: Unresolved reference concerns ──────────────────────
  if (reference_verification_records.length > 0) {
    const unresolvedConcerns = refsWithConcernsCount - refsConcernsFollowedUpCount;
    if (unresolvedConcerns >= 3) score -= 8;
    else if (unresolvedConcerns >= 2) score -= 5;
    else if (unresolvedConcerns >= 1) score -= 3;
  }

  // ── Penalty 4: Missing barred list checks ─────────────────────────
  if (barred_list_records.length > 0) {
    const barredIncompletePct = pct(barredNotStartedCount + barredPendingCount, totalBarred);
    if (barredIncompletePct >= 30) score -= 8;
    else if (barredIncompletePct >= 15) score -= 4;
    else if (barredIncompletePct >= 5) score -= 2;
  }

  // ── Clamp and rate ──────────────────────────────────────────────────
  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (dbsCurrencyRate >= 95 && totalDbs > 0) {
    strengths.push(
      `DBS currency rate at ${dbsCurrencyRate}% — ${dbsValidCount} of ${totalDbs} DBS checks are current and valid. Strong compliance with Reg 32.`
    );
  }

  if (enhancedDbsRate >= 95 && totalEnhanced > 0) {
    strengths.push(
      `Enhanced DBS coverage at ${enhancedDbsRate}% — ${enhancedValidCount} of ${totalEnhanced} enhanced checks are current, meeting safer recruitment requirements.`
    );
  }

  if (enhancedWithBarredListCount > 0 && totalEnhanced > 0) {
    const barredCovPct = pct(enhancedWithBarredListCount, totalEnhanced);
    if (barredCovPct >= 95) {
      strengths.push(
        `${barredCovPct}% of enhanced DBS checks include barred list verification — comprehensive safeguarding coverage.`
      );
    }
  }

  if (barredListRate >= 95 && totalBarred > 0) {
    strengths.push(
      `Barred list verification at ${barredListRate}% — ${barredCurrentCount} of ${totalBarred} checks are current and clear. Children are protected from unsuitable adults.`
    );
  }

  if (barredBothListsCheckedCount > 0 && barredCompletedCount > 0) {
    const bothListsPct = pct(barredBothListsCheckedCount, barredCompletedCount);
    if (bothListsPct >= 90) {
      strengths.push(
        `${bothListsPct}% of barred list checks cover both children's and adults' lists — thorough dual verification.`
      );
    }
  }

  if (referenceVerificationRate >= 90 && totalRefs > 0) {
    strengths.push(
      `Reference verification rate at ${referenceVerificationRate}% — ${refsVerifiedCount} of ${totalRefs} references verified as authentic.`
    );
  }

  if (childSuitabilityRate >= 90 && refsCompletedCount > 0) {
    strengths.push(
      `${childSuitabilityRate}% of completed references cover suitability for working with children — meeting SCCIF safety requirements.`
    );
  }

  if (beforeStartRate >= 90 && totalRefs > 0) {
    strengths.push(
      `${beforeStartRate}% of references obtained before start date — safer recruitment timeline fully met.`
    );
  }

  if (directContactRate >= 85 && refsCompletedCount > 0) {
    strengths.push(
      `${directContactRate}% of references involved direct contact with the referee — rigorous verification practice.`
    );
  }

  if (overseasCheckRate >= 90 && totalOverseas > 0) {
    strengths.push(
      `Overseas police check handling at ${overseasCheckRate}% — ${overseasHandled} of ${totalOverseas} checks completed or appropriately managed.`
    );
  }

  if (dbsOnUpdateServiceCount > 0 && completedDbsCount > 0 && dbsUpdateServiceRate >= 80) {
    strengths.push(
      `${dbsUpdateServiceRate}% of staff with completed DBS are enrolled on the update service — enabling real-time status monitoring.`
    );
  }

  if (dbsCertVerificationRate >= 95 && completedDbsCount > 0) {
    strengths.push(
      `${dbsCertVerificationRate}% of DBS certificates have been verified — excellent evidence management for inspection.`
    );
  }

  if (dbsExpiredCount === 0 && totalDbs > 0) {
    strengths.push(
      "No expired DBS checks across the staff team — all checks are within validity."
    );
  }

  if (enhancedExpiredCount === 0 && totalEnhanced > 0) {
    strengths.push(
      "No expired enhanced DBS checks — enhanced safeguarding coverage is fully maintained."
    );
  }

  if (fullyVettedRate >= 90 && (total_staff > 0 || allStaffIds.size > 0)) {
    strengths.push(
      `${fullyVettedRate}% of staff are fully vetted (DBS + enhanced + barred list + references) — comprehensive safer recruitment compliance.`
    );
  }

  if (disclosureRiskAssessmentRate >= 100 && dbsWithDisclosuresCount > 0) {
    strengths.push(
      `All ${dbsWithDisclosuresCount} DBS disclosure${dbsWithDisclosuresCount > 1 ? "s have" : " has"} a completed risk assessment — appropriate safeguarding response to disclosures.`
    );
  }

  if ((renewalTimelinessRate ?? 0) >= 85 && timelinessComponents.length >= 3) {
    strengths.push(
      `Overall renewal timeliness rate is ${renewalTimelinessRate}% — DBS renewals and vetting updates are managed proactively.`
    );
  }

  if (gapsExplorationRate >= 85 && refsCompletedCount > 0) {
    strengths.push(
      `${gapsExplorationRate}% of completed references include employment gap exploration — thorough safer recruitment practice.`
    );
  }

  if (concernFollowUpRate >= 100 && refsWithConcernsCount > 0) {
    strengths.push(
      `All reference concerns have been followed up — robust response to potential recruitment risks.`
    );
  }

  if (regulatedActivityRate >= 95 && regulatedActivityRecords.length > 0) {
    strengths.push(
      `${regulatedActivityRate}% of staff in regulated activity have enhanced DBS with barred list — full compliance with statutory requirements.`
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (dbsCurrencyRate < 70 && totalDbs > 0) {
    concerns.push(
      `DBS currency rate is only ${dbsCurrencyRate}% — Reg 32 requires current DBS checks for all staff. ${totalDbs - dbsValidCount} check${totalDbs - dbsValidCount !== 1 ? "s are" : " is"} non-compliant.`
    );
  }

  if (dbsExpiredCount > 0) {
    concerns.push(
      `${dbsExpiredCount} DBS check${dbsExpiredCount > 1 ? "s have" : " has"} expired — immediate renewal required to maintain Reg 32 compliance and safeguard children.`
    );
  }

  if (dbsPendingCount > 0 && totalDbs > 0) {
    const pendingPct = pct(dbsPendingCount, totalDbs);
    if (pendingPct >= 15) {
      concerns.push(
        `${dbsPendingCount} DBS check${dbsPendingCount > 1 ? "s are" : " is"} pending (${pendingPct}%) — staff may be working without cleared vetting status.`
      );
    }
  }

  if (dbsExpiringSoonCount > 0) {
    concerns.push(
      `${dbsExpiringSoonCount} DBS check${dbsExpiringSoonCount > 1 ? "s" : ""} expiring within 30 days — proactive renewal needed to prevent compliance gaps.`
    );
  }

  if (enhancedDbsRate < 70 && totalEnhanced > 0) {
    concerns.push(
      `Enhanced DBS coverage is only ${enhancedDbsRate}% — staff in regulated activity must have enhanced checks with barred list verification.`
    );
  }

  if (enhancedExpiredCount > 0) {
    concerns.push(
      `${enhancedExpiredCount} enhanced DBS check${enhancedExpiredCount > 1 ? "s have" : " has"} expired — these staff may be working in regulated activity without valid enhanced clearance.`
    );
  }

  if (enhancedExpiringSoonCount > 0) {
    concerns.push(
      `${enhancedExpiringSoonCount} enhanced DBS check${enhancedExpiringSoonCount > 1 ? "s are" : " is"} expiring within 60 days — renewal applications should be submitted now.`
    );
  }

  if (enhancedWithBarredListCount < totalEnhanced && totalEnhanced > 0) {
    const missingBarred = totalEnhanced - enhancedWithBarredListCount;
    if (missingBarred > 0) {
      const barredMissingPct = pct(missingBarred, totalEnhanced);
      if (barredMissingPct >= 10) {
        concerns.push(
          `${missingBarred} enhanced DBS check${missingBarred > 1 ? "s do" : " does"} not include barred list verification — this is required for staff in regulated activity.`
        );
      }
    }
  }

  if (barredListRate < 70 && totalBarred > 0) {
    concerns.push(
      `Barred list verification rate is only ${barredListRate}% — children may be at risk from staff whose barred list status is unconfirmed.`
    );
  }

  if (barredNotStartedCount > 0) {
    concerns.push(
      `${barredNotStartedCount} barred list check${barredNotStartedCount > 1 ? "s have" : " has"} not been started — this is a critical safeguarding gap.`
    );
  }

  if (barredPendingCount > 0 && totalBarred > 0) {
    concerns.push(
      `${barredPendingCount} barred list check${barredPendingCount > 1 ? "s are" : " is"} pending — staff should not work unsupervised until checks are complete.`
    );
  }

  if (referenceVerificationRate < 60 && totalRefs > 0) {
    concerns.push(
      `Reference verification rate is only ${referenceVerificationRate}% — many references have not been verified for authenticity. Safer recruitment is compromised.`
    );
  }

  if (refsWithConcernsCount > 0 && refsConcernsFollowedUpCount < refsWithConcernsCount) {
    const unresolved = refsWithConcernsCount - refsConcernsFollowedUpCount;
    concerns.push(
      `${unresolved} reference concern${unresolved > 1 ? "s have" : " has"} not been followed up — unresolved concerns present a safeguarding risk.`
    );
  }

  if (beforeStartRate < 60 && totalRefs > 0) {
    concerns.push(
      `Only ${beforeStartRate}% of references were obtained before staff start date — safer recruitment timeline is not being followed.`
    );
  }

  if (childSuitabilityRate < 50 && refsCompletedCount > 0) {
    concerns.push(
      `Only ${childSuitabilityRate}% of references cover suitability for working with children — this is a fundamental safer recruitment requirement.`
    );
  }

  if (overseasPendingCount > 0 && totalOverseas > 0) {
    concerns.push(
      `${overseasPendingCount} overseas police check${overseasPendingCount > 1 ? "s are" : " is"} pending — staff with overseas history need completed checks.`
    );
  }

  if (overseasNotStartedCount > 0) {
    concerns.push(
      `${overseasNotStartedCount} overseas police check${overseasNotStartedCount > 1 ? "s have" : " has"} not been started — these must be obtained for staff who have lived or worked abroad.`
    );
  }

  if (dbsWithDisclosuresCount > 0 && dbsRiskAssessmentsCompleted < dbsWithDisclosuresCount) {
    const missingRA = dbsWithDisclosuresCount - dbsRiskAssessmentsCompleted;
    concerns.push(
      `${missingRA} DBS disclosure${missingRA > 1 ? "s lack" : " lacks"} a completed risk assessment — all disclosures must be risk-assessed before the staff member works with children.`
    );
  }

  if (total_staff > 0 && staffWithDbs < total_staff && totalDbs > 0) {
    const uncoveredStaff = total_staff - staffWithDbs;
    if (uncoveredStaff > 0) {
      concerns.push(
        `${uncoveredStaff} staff member${uncoveredStaff > 1 ? "s have" : " has"} no DBS check record — all staff must have DBS checks on file.`
      );
    }
  }

  if (dbsRejectedCount > 0) {
    concerns.push(
      `${dbsRejectedCount} DBS check${dbsRejectedCount > 1 ? "s were" : " was"} rejected — investigate and ensure affected staff are not working with children without clearance.`
    );
  }

  if (refsDeclinedCount > 0) {
    concerns.push(
      `${refsDeclinedCount} reference${refsDeclinedCount > 1 ? "s were" : " was"} declined — alternative references should be sought and the reason for decline explored.`
    );
  }

  if (gapsExplorationRate < 50 && refsCompletedCount > 0) {
    concerns.push(
      `Only ${gapsExplorationRate}% of completed references include employment gap exploration — gaps in employment must be explored under safer recruitment guidance.`
    );
  }

  if (fullyVettedRate < 50 && (total_staff > 0 || allStaffIds.size > 0)) {
    concerns.push(
      `Only ${fullyVettedRate}% of staff are fully vetted across all categories — significant gaps in the vetting process exist.`
    );
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
  if (dbsExpiredCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Arrange immediate DBS renewal for ${dbsExpiredCount} expired check${dbsExpiredCount > 1 ? "s" : ""} — staff with expired DBS checks must not work unsupervised with children.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (enhancedExpiredCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Renew ${enhancedExpiredCount} expired enhanced DBS check${enhancedExpiredCount > 1 ? "s" : ""} — staff in regulated activity require valid enhanced clearance at all times.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (barredNotStartedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete barred list checks for ${barredNotStartedCount} staff member${barredNotStartedCount > 1 ? "s" : ""} immediately — no person should work with children without barred list verification.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (dbsWithDisclosuresCount > 0 && dbsRiskAssessmentsCompleted < dbsWithDisclosuresCount) {
    const missingRA = dbsWithDisclosuresCount - dbsRiskAssessmentsCompleted;
    recs.push({
      rank: rank++,
      recommendation: `Complete risk assessments for ${missingRA} DBS disclosure${missingRA > 1 ? "s" : ""} — all disclosures require a documented risk assessment before the staff member can work unsupervised.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (refsWithConcernsCount > 0 && refsConcernsFollowedUpCount < refsWithConcernsCount) {
    const unresolved = refsWithConcernsCount - refsConcernsFollowedUpCount;
    recs.push({
      rank: rank++,
      recommendation: `Follow up on ${unresolved} unresolved reference concern${unresolved > 1 ? "s" : ""} immediately — concerns in references may indicate unsuitability for working with children.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (dbsCurrencyRate < 70 && totalDbs > 0) {
    recs.push({
      rank: rank++,
      recommendation: `DBS currency is at ${dbsCurrencyRate}% — urgently review and renew all non-current checks to achieve minimum 90% compliance under Reg 32.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (dbsRejectedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Investigate ${dbsRejectedCount} rejected DBS application${dbsRejectedCount > 1 ? "s" : ""} — determine the reason for rejection and whether affected staff should continue in post.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  // Soon urgency recommendations
  if (dbsExpiringSoonCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Submit renewal applications for ${dbsExpiringSoonCount} DBS check${dbsExpiringSoonCount > 1 ? "s" : ""} expiring within 30 days to prevent compliance gaps.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (enhancedExpiringSoonCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Submit renewal applications for ${enhancedExpiringSoonCount} enhanced DBS check${enhancedExpiringSoonCount > 1 ? "s" : ""} expiring within 60 days.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (overseasPendingCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Chase ${overseasPendingCount} pending overseas police check${overseasPendingCount > 1 ? "s" : ""} — ensure checks are received or alternative verification obtained.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (overseasNotStartedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Initiate overseas police checks for ${overseasNotStartedCount} staff member${overseasNotStartedCount > 1 ? "s" : ""} with overseas history. Where unavailable, obtain letters of good standing.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (barredPendingCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Chase ${barredPendingCount} pending barred list check${barredPendingCount > 1 ? "s" : ""} — ensure results are obtained promptly and staff are supervised until cleared.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (referenceVerificationRate < 75 && totalRefs > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve reference verification rate from ${referenceVerificationRate}% — contact referees directly to confirm authenticity of all unverified references.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (childSuitabilityRate < 70 && refsCompletedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Ensure references specifically address suitability for working with children — currently only ${childSuitabilityRate}%. Revise reference request templates.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (beforeStartRate < 70 && totalRefs > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Strengthen safer recruitment timelines — only ${beforeStartRate}% of references obtained before start date. References must be received and verified before employment begins.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (gapsExplorationRate < 60 && refsCompletedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve employment gap exploration in references — only ${gapsExplorationRate}% of references address gaps. Embed gap questions into reference request forms.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  // Planned urgency recommendations
  if (dbsOnUpdateServiceCount > 0 && dbsUpdateServiceRate < 70 && completedDbsCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase DBS update service enrolment — currently at ${dbsUpdateServiceRate}%. Update service enables real-time status checks and reduces renewal burden.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (dbsExpiring90DaysCount > 0 && dbsExpiringSoonCount === 0) {
    recs.push({
      rank: rank++,
      recommendation: `Plan DBS renewals for ${dbsExpiring90DaysCount} check${dbsExpiring90DaysCount > 1 ? "s" : ""} expiring within 90 days — proactive renewal prevents last-minute compliance pressure.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (dbsCertVerificationRate < 80 && completedDbsCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve DBS certificate verification — currently at ${dbsCertVerificationRate}%. All DBS certificates should be physically seen, verified, and recorded.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (directContactRate < 70 && refsCompletedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase direct referee contact rate from ${directContactRate}% — telephone or in-person contact with referees provides stronger verification than written references alone.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (refsDeclinedCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review ${refsDeclinedCount} declined reference${refsDeclinedCount > 1 ? "s" : ""} — investigate reasons for refusal and obtain alternative references.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (total_staff > 0 && staffWithDbs < total_staff) {
    const gap = total_staff - staffWithDbs;
    if (gap > 0) {
      recs.push({
        rank: rank++,
        recommendation: `${gap} staff member${gap > 1 ? "s have" : " has"} no DBS record — ensure all staff (including ancillary, agency, and volunteer workers) have DBS checks recorded.`,
        urgency: "planned",
        regulatory_ref: "CHR 2015 Reg 32",
      });
    }
  }

  if (barredVerifiedCount < barredCompletedCount && barredCompletedCount > 0) {
    const unverified = barredCompletedCount - barredVerifiedCount;
    recs.push({
      rank: rank++,
      recommendation: `Verify and sign off ${unverified} barred list check${unverified > 1 ? "s" : ""} — all barred list checks should have management sign-off documented.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (refTypeCount < 2 && totalRefs >= 3) {
    recs.push({
      rank: rank++,
      recommendation: `Diversify reference types — currently only ${refTypeCount} type${refTypeCount !== 1 ? "s" : ""} obtained. Best practice includes employment, character, and professional references.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (refsPendingCount > 0 && totalRefs > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Follow up on ${refsPendingCount} pending reference${refsPendingCount > 1 ? "s" : ""} — references should be received and verified within 2 weeks of request.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHTS (with severity: critical, warning, positive)
  // ══════════════════════════════════════════════════════════════════════

  const insights: { text: string; severity: string }[] = [];

  // ── Critical insights ────────────────────────────────────────────────

  if (dbsExpiredCount >= 5 && totalDbs > 0) {
    insights.push({
      text: `${dbsExpiredCount} DBS checks have expired across the team. This represents a serious safeguarding and compliance risk — Ofsted will identify this as a significant concern during inspection under Reg 32.`,
      severity: "critical",
    });
  } else if (dbsExpiredCount >= 3 && totalDbs > 0) {
    insights.push({
      text: `${dbsExpiredCount} DBS checks have expired. Multiple expired checks indicate a systemic failure in DBS renewal governance that requires immediate management intervention.`,
      severity: "critical",
    });
  } else if (dbsExpiredCount > 0) {
    insights.push({
      text: `${dbsExpiredCount} DBS check${dbsExpiredCount > 1 ? "s have" : " has"} expired — prioritise renewal to maintain Reg 32 compliance.`,
      severity: "warning",
    });
  }

  if (enhancedExpiredCount >= 3 && totalEnhanced > 0) {
    insights.push({
      text: `${enhancedExpiredCount} enhanced DBS checks have expired. Staff in regulated activity without valid enhanced clearance are a safeguarding concern that Ofsted will treat as requiring immediate action.`,
      severity: "critical",
    });
  } else if (enhancedExpiredCount > 0) {
    insights.push({
      text: `${enhancedExpiredCount} enhanced DBS check${enhancedExpiredCount > 1 ? "s have" : " has"} expired — enhanced clearance is required for all staff working in regulated activity.`,
      severity: "warning",
    });
  }

  if (barredNotStartedCount >= 3) {
    insights.push({
      text: `${barredNotStartedCount} staff have no barred list check initiated. This is a critical safeguarding failure — staff should not work with children without barred list verification.`,
      severity: "critical",
    });
  } else if (barredNotStartedCount > 0) {
    insights.push({
      text: `${barredNotStartedCount} barred list check${barredNotStartedCount > 1 ? "s have" : " has"} not been started — these must be completed before staff work unsupervised.`,
      severity: "critical",
    });
  }

  if (dbsWithDisclosuresCount > 0 && dbsRiskAssessmentsCompleted < dbsWithDisclosuresCount) {
    const missing = dbsWithDisclosuresCount - dbsRiskAssessmentsCompleted;
    insights.push({
      text: `${missing} DBS disclosure${missing > 1 ? "s are" : " is"} without a completed risk assessment. Staff with disclosures must have documented risk assessments — this is a critical safeguarding and regulatory requirement.`,
      severity: "critical",
    });
  }

  if (refsWithConcernsCount > 0 && refsConcernsFollowedUpCount < refsWithConcernsCount) {
    const unresolved = refsWithConcernsCount - refsConcernsFollowedUpCount;
    if (unresolved >= 2) {
      insights.push({
        text: `${unresolved} reference concerns remain unresolved. Unaddressed concerns in references may mean unsuitable individuals are working with children — follow-up is essential.`,
        severity: "critical",
      });
    } else {
      insights.push({
        text: `${unresolved} reference concern has not been followed up — all concerns raised in references must be investigated and documented.`,
        severity: "warning",
      });
    }
  }

  if (fullyVettedRate < 30 && (total_staff > 0 || allStaffIds.size > 0)) {
    insights.push({
      text: `Only ${fullyVettedRate}% of staff are fully vetted across all categories. This indicates systemic weaknesses in safer recruitment that Ofsted will flag as a serious concern.`,
      severity: "critical",
    });
  }

  if (dbsCurrencyRate < 50 && totalDbs > 0) {
    insights.push({
      text: `DBS currency rate is at ${dbsCurrencyRate}% — more than half of DBS checks are not current. This is below any acceptable compliance threshold and will be flagged as inadequate.`,
      severity: "critical",
    });
  }

  if (regulatedActivityRate < 70 && regulatedActivityRecords.length >= 3) {
    insights.push({
      text: `Only ${regulatedActivityRate}% of staff in regulated activity have compliant enhanced DBS with barred list checks. This is a statutory requirement — non-compliance is a safeguarding risk.`,
      severity: "critical",
    });
  }

  // ── Warning insights ─────────────────────────────────────────────────

  if (dbsExpiringSoonCount >= 3) {
    insights.push({
      text: `${dbsExpiringSoonCount} DBS checks are expiring within 30 days. Without proactive renewal, compliance will deteriorate significantly.`,
      severity: "warning",
    });
  } else if (dbsExpiringSoonCount > 0) {
    insights.push({
      text: `${dbsExpiringSoonCount} DBS check${dbsExpiringSoonCount > 1 ? "s are" : " is"} expiring within 30 days — initiate renewal applications promptly.`,
      severity: "warning",
    });
  }

  if (enhancedExpiringSoonCount >= 2) {
    insights.push({
      text: `${enhancedExpiringSoonCount} enhanced DBS checks are expiring within 60 days. Early submission ensures continuity of enhanced clearance for regulated activity.`,
      severity: "warning",
    });
  }

  if (dbsUpdateServiceRate < 50 && completedDbsCount >= 5) {
    insights.push({
      text: `Only ${dbsUpdateServiceRate}% of staff with completed DBS are on the update service. Enrolling on the update service allows real-time portability checks and reduces renewal admin.`,
      severity: "warning",
    });
  }

  if (overseasPendingCount >= 2 && totalOverseas > 0) {
    insights.push({
      text: `${overseasPendingCount} overseas police checks are pending. Delays in overseas checks can leave safeguarding gaps — consider interim risk assessments and supervision arrangements.`,
      severity: "warning",
    });
  }

  if (referenceVerificationRate >= 50 && referenceVerificationRate < 75 && totalRefs > 0) {
    insights.push({
      text: `Reference verification rate is ${referenceVerificationRate}%. While some verification is occurring, strengthening direct referee contact would improve confidence in safer recruitment.`,
      severity: "warning",
    });
  }

  if (beforeStartRate < 70 && beforeStartRate >= 40 && totalRefs > 0) {
    insights.push({
      text: `Only ${beforeStartRate}% of references were obtained before start date. References obtained after employment begins weaken the safer recruitment process — review your timeline procedures.`,
      severity: "warning",
    });
  }

  if (dbsPendingCount >= 3 && totalDbs > 0) {
    insights.push({
      text: `${dbsPendingCount} DBS checks are pending. A high volume of pending checks may indicate bottlenecks in the application process — review your DBS application workflow.`,
      severity: "warning",
    });
  }

  if (barredBothListsCheckedCount < barredCompletedCount && barredCompletedCount > 0) {
    const singleList = barredCompletedCount - barredBothListsCheckedCount;
    if (singleList > 0) {
      insights.push({
        text: `${singleList} barred list check${singleList > 1 ? "s cover" : " covers"} only one list. Best practice for children's home staff is to check both children's and adults' barred lists.`,
        severity: "warning",
      });
    }
  }

  if (refsDeclinedCount >= 2 && totalRefs > 0) {
    insights.push({
      text: `${refsDeclinedCount} references have been declined. Multiple declined references should be explored — a pattern of refusal may indicate concerns about the applicant.`,
      severity: "warning",
    });
  }

  if (childSuitabilityRate >= 50 && childSuitabilityRate < 70 && refsCompletedCount > 0) {
    insights.push({
      text: `Only ${childSuitabilityRate}% of references specifically cover suitability for working with children. Reference request templates should explicitly ask about child suitability.`,
      severity: "warning",
    });
  }

  // ── Positive insights ────────────────────────────────────────────────

  if (
    dbsCurrencyRate >= 95 &&
    enhancedDbsRate >= 95 &&
    barredListRate >= 95 &&
    referenceVerificationRate >= 90 &&
    totalDbs > 0 &&
    totalEnhanced > 0 &&
    totalBarred > 0 &&
    totalRefs > 0
  ) {
    insights.push({
      text: `Comprehensive safer recruitment compliance: ${dbsCurrencyRate}% DBS currency, ${enhancedDbsRate}% enhanced DBS coverage, ${barredListRate}% barred list verification, ${referenceVerificationRate}% reference verification. Excellent position for Ofsted inspection.`,
      severity: "positive",
    });
  }

  if (fullyVettedRate >= 90 && (total_staff > 0 || allStaffIds.size > 0)) {
    insights.push({
      text: `${fullyVettedRate}% of staff are fully vetted across all categories (DBS, enhanced DBS, barred list, references). This demonstrates a robust safer recruitment process.`,
      severity: "positive",
    });
  }

  if ((renewalTimelinessRate ?? 0) >= 90 && timelinessComponents.length >= 4) {
    insights.push({
      text: `Renewal timeliness rate is ${renewalTimelinessRate}% across ${timelinessComponents.length} measures — proactive management of DBS renewals and vetting updates is embedded in practice.`,
      severity: "positive",
    });
  }

  if (disclosureRiskAssessmentRate >= 100 && dbsWithDisclosuresCount >= 2) {
    insights.push({
      text: `All ${dbsWithDisclosuresCount} DBS disclosures have completed risk assessments. The home demonstrates robust processes for managing disclosures and making informed decisions about staff suitability.`,
      severity: "positive",
    });
  }

  if (dbsOnUpdateServiceCount > 0 && dbsUpdateServiceRate >= 80 && completedDbsCount >= 5) {
    insights.push({
      text: `${dbsUpdateServiceRate}% of staff are enrolled on the DBS update service — this enables real-time status checks and demonstrates forward-thinking vetting governance.`,
      severity: "positive",
    });
  }

  if (beforeStartRate >= 95 && totalRefs >= 5) {
    insights.push({
      text: `${beforeStartRate}% of references obtained before start date across ${totalRefs} references — exemplary safer recruitment timeline compliance.`,
      severity: "positive",
    });
  }

  if (directContactRate >= 90 && refsCompletedCount >= 5) {
    insights.push({
      text: `${directContactRate}% of references involved direct referee contact — the home goes beyond written references to verify applicant suitability through personal engagement.`,
      severity: "positive",
    });
  }

  if (childSuitabilityRate >= 95 && refsCompletedCount >= 5) {
    insights.push({
      text: `${childSuitabilityRate}% of references specifically address suitability for working with children — thorough alignment with SCCIF safety expectations.`,
      severity: "positive",
    });
  }

  if (gapsExplorationRate >= 90 && refsCompletedCount >= 5) {
    insights.push({
      text: `${gapsExplorationRate}% of references include employment gap exploration across ${refsCompletedCount} references — comprehensive approach to understanding applicant history.`,
      severity: "positive",
    });
  }

  if (dbsExpiredCount === 0 && enhancedExpiredCount === 0 && totalDbs > 0 && totalEnhanced > 0) {
    insights.push({
      text: "No expired DBS or enhanced DBS checks across the staff team — currency is fully maintained for both standard and enhanced checks.",
      severity: "positive",
    });
  }

  if (barredBothListsCheckedCount === barredCompletedCount && barredCompletedCount >= 3) {
    insights.push({
      text: `All ${barredCompletedCount} completed barred list checks cover both children's and adults' lists — comprehensive dual verification is in place.`,
      severity: "positive",
    });
  }

  if (overseasCheckRate >= 95 && totalOverseas >= 3) {
    insights.push({
      text: `Overseas police check handling at ${overseasCheckRate}% across ${totalOverseas} checks covering ${countryCount} countr${countryCount > 1 ? "ies" : "y"} — thorough international vetting practice.`,
      severity: "positive",
    });
  }

  if (concernFollowUpRate >= 100 && refsWithConcernsCount >= 2) {
    insights.push({
      text: `All ${refsWithConcernsCount} reference concerns have been followed up and documented. The home demonstrates a diligent approach to managing recruitment risk.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════

  let headline: string;

  if (rating === "outstanding") {
    headline = "DBS renewal and staff vetting compliance is outstanding — DBS checks, enhanced clearance, barred list verification, and reference checks all performing strongly across the team.";
  } else if (rating === "good") {
    const issues: string[] = [];
    if (dbsExpiredCount > 0) issues.push(`${dbsExpiredCount} expired DBS`);
    if (enhancedExpiredCount > 0) issues.push(`${enhancedExpiredCount} expired enhanced DBS`);
    if (barredPendingCount > 0 || barredNotStartedCount > 0) issues.push(`${barredPendingCount + barredNotStartedCount} incomplete barred list check${barredPendingCount + barredNotStartedCount > 1 ? "s" : ""}`);
    if (refsWithConcernsCount > refsConcernsFollowedUpCount) issues.push(`${refsWithConcernsCount - refsConcernsFollowedUpCount} unresolved reference concern${(refsWithConcernsCount - refsConcernsFollowedUpCount) > 1 ? "s" : ""}`);
    headline = issues.length > 0
      ? `Good overall DBS and vetting compliance — attention needed on ${issues.join(", ")}.`
      : "Good DBS renewal and staff vetting compliance — safer recruitment practices are maintained across key areas.";
  } else if (rating === "adequate") {
    const gaps: string[] = [];
    if (dbsCurrencyRate < 70 && totalDbs > 0) gaps.push("DBS currency");
    if (enhancedDbsRate < 70 && totalEnhanced > 0) gaps.push("enhanced DBS coverage");
    if (barredListRate < 70 && totalBarred > 0) gaps.push("barred list verification");
    if (referenceVerificationRate < 60 && totalRefs > 0) gaps.push("reference verification");
    if (overseasCheckRate < 60 && totalOverseas > 0) gaps.push("overseas checks");
    headline = gaps.length > 0
      ? `Adequate DBS and vetting compliance — gaps in ${gaps.join(", ")} require focused attention to meet safer recruitment expectations.`
      : "Adequate DBS renewal and staff vetting compliance — improvements needed across multiple areas to reach good or outstanding.";
  } else {
    headline = "DBS and staff vetting compliance is inadequate — multiple safer recruitment requirements under Reg 32/33 are unmet. Immediate action required to address DBS, barred list, and reference verification gaps.";
  }

  // ══════════════════════════════════════════════════════════════════════
  // RETURN RESULT
  // ══════════════════════════════════════════════════════════════════════

  return {
    vetting_rating: rating,
    vetting_score: score,
    headline,

    // Key metrics
    dbs_currency_rate: dbsCurrencyRate,
    enhanced_dbs_rate: enhancedDbsRate,
    overseas_check_rate: overseasCheckRate,
    barred_list_rate: barredListRate,
    reference_verification_rate: referenceVerificationRate,
    renewal_timeliness_rate: renewalTimelinessRate,

    // Detailed metrics
    dbs_total_records: totalDbs,
    dbs_valid_count: dbsValidCount,
    dbs_expired_count: dbsExpiredCount,
    dbs_pending_count: dbsPendingCount,
    dbs_on_update_service_count: dbsOnUpdateServiceCount,
    dbs_certificate_verified_count: dbsCertificateVerifiedCount,
    dbs_with_disclosures_count: dbsWithDisclosuresCount,
    dbs_risk_assessments_completed: dbsRiskAssessmentsCompleted,
    enhanced_dbs_total: totalEnhanced,
    enhanced_dbs_valid_count: enhancedValidCount,
    enhanced_dbs_with_barred_list_count: enhancedWithBarredListCount,
    enhanced_dbs_expired_count: enhancedExpiredCount,
    overseas_checks_total: totalOverseas,
    overseas_checks_completed: overseasCompletedCount,
    overseas_checks_clear: overseasClearCount,
    overseas_checks_pending: overseasPendingCount,
    barred_list_total: totalBarred,
    barred_list_completed: barredCompletedCount,
    barred_list_clear_count: barredClearCount,
    barred_list_children_checked_count: barredChildrenCheckedCount,
    barred_list_adults_checked_count: barredAdultsCheckedCount,
    references_total: totalRefs,
    references_completed: refsCompletedCount,
    references_verified: refsVerifiedCount,
    references_satisfactory: refsSatisfactoryCount,
    references_with_concerns: refsWithConcernsCount,
    references_concerns_followed_up: refsConcernsFollowedUpCount,
    references_obtained_before_start: refsBeforeStartCount,
    staff_with_dbs_coverage: staffWithDbs,
    staff_fully_vetted_count: staffFullyVettedCount,

    // Narrative
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
