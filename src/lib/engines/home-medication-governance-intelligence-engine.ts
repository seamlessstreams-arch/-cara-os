// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION GOVERNANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses medication audit records, error investigations, near misses,
// stock checks, storage audits, and emergency medication protocols to
// surface governance quality, safety culture, and regulatory compliance.
//
// Regulatory: CHR 2015 Reg 12 — Medication management.
// NICE guidelines on safe medication practices in children's homes.
// SCCIF: "Are medications managed safely and effectively?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MedAuditInput {
  id: string;
  date: string;
  audit_type: string;
  result: "pass" | "fail" | "action_required";
  discrepancy: number;
  storage_correct: boolean;
  temperature_ok: boolean;
  labelling_correct: boolean;
  follow_up_required: boolean;
}

export interface MedErrorInput {
  id: string;
  date_of_error: string;
  error_severity: "no_harm" | "minor_harm" | "moderate_harm" | "major_harm";
  status: string;
  debrief_held: boolean;
  root_cause_documented: boolean;
  systemic_changes_count: number;
  preventive_action_embedded: boolean;
  ofsted_notification_required: boolean;
}

export interface NearMissInput {
  id: string;
  date: string;
  risk_grade: "low" | "medium" | "high" | "critical";
  learning_points_count: number;
  debrief_held: boolean;
}

export interface StockCheckInput {
  id: string;
  date: string;
  check_type: string;
  status: "balanced" | "discrepancy" | "action_required";
  items_count: number;
  discrepancy_count: number;
}

export interface StorageAuditInput {
  id: string;
  audit_date: string;
  overall_verdict: string;
  temperature_within_range: boolean;
  expiry_check_completed: boolean;
  expired_items_count: number;
  controlled_drugs_correct: boolean;
  security_pass: boolean;
  keys_accounted: boolean;
  record_keeping_pass: boolean;
  next_audit_due: string;
  open_follow_ups: number;
}

export interface EmergencyProtocolInput {
  id: string;
  child_id: string;
  staff_trained_count: number;
  child_self_administer: boolean;
  child_recognises_symptoms: boolean;
  last_review_date: string;
  next_review_due: string;
  signed_off_by_gp: boolean;
}

export interface HomeMedicationGovernanceInput {
  today: string;
  audits: MedAuditInput[];
  errors: MedErrorInput[];
  nearMisses: NearMissInput[];
  stockChecks: StockCheckInput[];
  storageAudits: StorageAuditInput[];
  emergencyProtocols: EmergencyProtocolInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MedicationGovernanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AuditProfile {
  total_audits: number;
  pass_count: number;
  fail_count: number;
  action_required_count: number;
  pass_rate: number;
  discrepancy_count: number;
  storage_correct_rate: number;
  temperature_ok_rate: number;
  labelling_correct_rate: number;
  follow_up_required_count: number;
}

export interface ErrorProfile {
  total_errors: number;
  by_severity: Record<string, number>;
  no_harm_count: number;
  minor_harm_count: number;
  moderate_harm_count: number;
  major_harm_count: number;
  debrief_rate: number;
  root_cause_rate: number;
  preventive_embedded_rate: number;
  open_investigations: number;
  ofsted_notifiable_count: number;
}

export interface NearMissProfile {
  total_near_misses: number;
  by_risk_grade: Record<string, number>;
  high_critical_count: number;
  debrief_rate: number;
  avg_learning_points: number;
}

export interface StockProfile {
  total_checks: number;
  balanced_count: number;
  discrepancy_count: number;
  action_required_count: number;
  balanced_rate: number;
  weekly_checks: number;
  monthly_audits: number;
  total_discrepant_items: number;
}

export interface StorageProfile {
  total_audits: number;
  pass_count: number;
  pass_with_minor_count: number;
  fail_count: number;
  pass_rate: number;
  temperature_compliance_rate: number;
  expiry_check_rate: number;
  total_expired_items: number;
  controlled_drugs_correct_rate: number;
  security_pass_rate: number;
  keys_accounted_rate: number;
  record_keeping_rate: number;
  overdue_audits: number;
  open_follow_ups: number;
}

export interface EmergencyProtocolProfile {
  total_protocols: number;
  unique_children: number;
  gp_signed_off_rate: number;
  avg_staff_trained: number;
  self_administer_count: number;
  recognises_symptoms_count: number;
  overdue_reviews: number;
  reviews_due_soon: number;
}

export interface HomeMedicationGovernanceResult {
  governance_rating: MedicationGovernanceRating;
  governance_score: number;
  headline: string;
  audit: AuditProfile;
  errors: ErrorProfile;
  nearMisses: NearMissProfile;
  stock: StockProfile;
  storage: StorageProfile;
  emergencyProtocols: EmergencyProtocolProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeMedicationGovernance(
  input: HomeMedicationGovernanceInput,
): HomeMedicationGovernanceResult {
  const { today, audits, errors, nearMisses, stockChecks, storageAudits, emergencyProtocols } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (
    audits.length === 0 &&
    errors.length === 0 &&
    nearMisses.length === 0 &&
    stockChecks.length === 0 &&
    storageAudits.length === 0 &&
    emergencyProtocols.length === 0
  ) {
    return {
      governance_rating: "insufficient_data",
      governance_score: 0,
      headline: "No medication governance data available for analysis.",
      audit: { total_audits: 0, pass_count: 0, fail_count: 0, action_required_count: 0, pass_rate: 0, discrepancy_count: 0, storage_correct_rate: 0, temperature_ok_rate: 0, labelling_correct_rate: 0, follow_up_required_count: 0 },
      errors: { total_errors: 0, by_severity: {}, no_harm_count: 0, minor_harm_count: 0, moderate_harm_count: 0, major_harm_count: 0, debrief_rate: 0, root_cause_rate: 0, preventive_embedded_rate: 0, open_investigations: 0, ofsted_notifiable_count: 0 },
      nearMisses: { total_near_misses: 0, by_risk_grade: {}, high_critical_count: 0, debrief_rate: 0, avg_learning_points: 0 },
      stock: { total_checks: 0, balanced_count: 0, discrepancy_count: 0, action_required_count: 0, balanced_rate: 0, weekly_checks: 0, monthly_audits: 0, total_discrepant_items: 0 },
      storage: { total_audits: 0, pass_count: 0, pass_with_minor_count: 0, fail_count: 0, pass_rate: 0, temperature_compliance_rate: 0, expiry_check_rate: 0, total_expired_items: 0, controlled_drugs_correct_rate: 0, security_pass_rate: 0, keys_accounted_rate: 0, record_keeping_rate: 0, overdue_audits: 0, open_follow_ups: 0 },
      emergencyProtocols: { total_protocols: 0, unique_children: 0, gp_signed_off_rate: 0, avg_staff_trained: 0, self_administer_count: 0, recognises_symptoms_count: 0, overdue_reviews: 0, reviews_due_soon: 0 },
      strengths: [],
      concerns: ["No medication governance data recorded — unable to assess medication governance."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Audit Profile ─────────────────────────────────────────────────────
  const auditPassCount = audits.filter(a => a.result === "pass").length;
  const auditFailCount = audits.filter(a => a.result === "fail").length;
  const auditActionCount = audits.filter(a => a.result === "action_required").length;
  const auditPassRate = pct(auditPassCount, audits.length);
  const auditDiscrepancies = audits.filter(a => a.discrepancy > 0).length;
  const storageCorrectRate = pct(audits.filter(a => a.storage_correct).length, audits.length);
  const temperatureOkRate = pct(audits.filter(a => a.temperature_ok).length, audits.length);
  const labellingCorrectRate = pct(audits.filter(a => a.labelling_correct).length, audits.length);
  const followUpRequired = audits.filter(a => a.follow_up_required).length;

  const audit: AuditProfile = {
    total_audits: audits.length,
    pass_count: auditPassCount,
    fail_count: auditFailCount,
    action_required_count: auditActionCount,
    pass_rate: auditPassRate,
    discrepancy_count: auditDiscrepancies,
    storage_correct_rate: storageCorrectRate,
    temperature_ok_rate: temperatureOkRate,
    labelling_correct_rate: labellingCorrectRate,
    follow_up_required_count: followUpRequired,
  };

  // ── Error Profile ─────────────────────────────────────────────────────
  const bySeverity: Record<string, number> = {};
  for (const e of errors) {
    bySeverity[e.error_severity] = (bySeverity[e.error_severity] ?? 0) + 1;
  }
  const noHarm = errors.filter(e => e.error_severity === "no_harm").length;
  const minorHarm = errors.filter(e => e.error_severity === "minor_harm").length;
  const moderateHarm = errors.filter(e => e.error_severity === "moderate_harm").length;
  const majorHarm = errors.filter(e => e.error_severity === "major_harm").length;
  const debriefedErrors = errors.filter(e => e.debrief_held).length;
  const rootCauseDocumented = errors.filter(e => e.root_cause_documented).length;
  const preventiveEmbedded = errors.filter(e => e.preventive_action_embedded).length;
  const openInvestigations = errors.filter(e => e.status === "investigating").length;
  const ofstedNotifiable = errors.filter(e => e.ofsted_notification_required).length;

  const errorProfile: ErrorProfile = {
    total_errors: errors.length,
    by_severity: bySeverity,
    no_harm_count: noHarm,
    minor_harm_count: minorHarm,
    moderate_harm_count: moderateHarm,
    major_harm_count: majorHarm,
    debrief_rate: pct(debriefedErrors, errors.length),
    root_cause_rate: pct(rootCauseDocumented, errors.length),
    preventive_embedded_rate: pct(preventiveEmbedded, errors.length),
    open_investigations: openInvestigations,
    ofsted_notifiable_count: ofstedNotifiable,
  };

  // ── Near Miss Profile ─────────────────────────────────────────────────
  const byRiskGrade: Record<string, number> = {};
  for (const nm of nearMisses) {
    byRiskGrade[nm.risk_grade] = (byRiskGrade[nm.risk_grade] ?? 0) + 1;
  }
  const highCriticalNM = nearMisses.filter(nm => nm.risk_grade === "high" || nm.risk_grade === "critical").length;
  const debriefedNM = nearMisses.filter(nm => nm.debrief_held).length;
  const totalLP = nearMisses.reduce((sum, nm) => sum + nm.learning_points_count, 0);
  const avgLP = nearMisses.length > 0 ? Math.round(totalLP / nearMisses.length) : 0;

  const nearMissProfile: NearMissProfile = {
    total_near_misses: nearMisses.length,
    by_risk_grade: byRiskGrade,
    high_critical_count: highCriticalNM,
    debrief_rate: pct(debriefedNM, nearMisses.length),
    avg_learning_points: avgLP,
  };

  // ── Stock Profile ─────────────────────────────────────────────────────
  const stockBalanced = stockChecks.filter(s => s.status === "balanced").length;
  const stockDiscrepancy = stockChecks.filter(s => s.status === "discrepancy").length;
  const stockActionRequired = stockChecks.filter(s => s.status === "action_required").length;
  const stockWeekly = stockChecks.filter(s => s.check_type === "weekly").length;
  const stockMonthly = stockChecks.filter(s => s.check_type === "monthly_audit").length;
  const totalDiscrepantItems = stockChecks.reduce((sum, s) => sum + s.discrepancy_count, 0);

  const stock: StockProfile = {
    total_checks: stockChecks.length,
    balanced_count: stockBalanced,
    discrepancy_count: stockDiscrepancy,
    action_required_count: stockActionRequired,
    balanced_rate: pct(stockBalanced, stockChecks.length),
    weekly_checks: stockWeekly,
    monthly_audits: stockMonthly,
    total_discrepant_items: totalDiscrepantItems,
  };

  // ── Storage Profile ───────────────────────────────────────────────────
  const stPass = storageAudits.filter(s => s.overall_verdict === "pass").length;
  const stPassMinor = storageAudits.filter(s => s.overall_verdict === "pass_with_minor_actions").length;
  const stFail = storageAudits.filter(s => s.overall_verdict === "fail_immediate_action").length;
  const stPassRate = pct(stPass + stPassMinor, storageAudits.length);
  const stTempRate = pct(storageAudits.filter(s => s.temperature_within_range).length, storageAudits.length);
  const stExpiryRate = pct(storageAudits.filter(s => s.expiry_check_completed).length, storageAudits.length);
  const stTotalExpired = storageAudits.reduce((sum, s) => sum + s.expired_items_count, 0);
  const stCdCorrectRate = pct(storageAudits.filter(s => s.controlled_drugs_correct).length, storageAudits.length);
  const stSecurityRate = pct(storageAudits.filter(s => s.security_pass).length, storageAudits.length);
  const stKeysRate = pct(storageAudits.filter(s => s.keys_accounted).length, storageAudits.length);
  const stRecordRate = pct(storageAudits.filter(s => s.record_keeping_pass).length, storageAudits.length);
  const stOverdue = storageAudits.filter(s => daysBetween(s.next_audit_due, today) > 0).length;
  const stOpenFollowUps = storageAudits.reduce((sum, s) => sum + s.open_follow_ups, 0);

  const storage: StorageProfile = {
    total_audits: storageAudits.length,
    pass_count: stPass,
    pass_with_minor_count: stPassMinor,
    fail_count: stFail,
    pass_rate: stPassRate,
    temperature_compliance_rate: stTempRate,
    expiry_check_rate: stExpiryRate,
    total_expired_items: stTotalExpired,
    controlled_drugs_correct_rate: stCdCorrectRate,
    security_pass_rate: stSecurityRate,
    keys_accounted_rate: stKeysRate,
    record_keeping_rate: stRecordRate,
    overdue_audits: stOverdue,
    open_follow_ups: stOpenFollowUps,
  };

  // ── Emergency Protocol Profile ────────────────────────────────────────
  const uniqueChildren = new Set(emergencyProtocols.map(p => p.child_id)).size;
  const gpSignedOff = emergencyProtocols.filter(p => p.signed_off_by_gp).length;
  const totalStaffTrained = emergencyProtocols.reduce((sum, p) => sum + p.staff_trained_count, 0);
  const avgStaffTrained = emergencyProtocols.length > 0 ? Math.round(totalStaffTrained / emergencyProtocols.length) : 0;
  const selfAdministerCount = emergencyProtocols.filter(p => p.child_self_administer).length;
  const recognisesSymptoms = emergencyProtocols.filter(p => p.child_recognises_symptoms).length;
  const overdueReviews = emergencyProtocols.filter(p => daysBetween(p.next_review_due, today) > 0).length;
  const reviewsDueSoon = emergencyProtocols.filter(p => {
    const days = daysBetween(today, p.next_review_due);
    return days >= 0 && days <= 30;
  }).length;

  const epProfile: EmergencyProtocolProfile = {
    total_protocols: emergencyProtocols.length,
    unique_children: uniqueChildren,
    gp_signed_off_rate: pct(gpSignedOff, emergencyProtocols.length),
    avg_staff_trained: avgStaffTrained,
    self_administer_count: selfAdministerCount,
    recognises_symptoms_count: recognisesSymptoms,
    overdue_reviews: overdueReviews,
    reviews_due_soon: reviewsDueSoon,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Audit pass rate (±5)
  if (audits.length === 0) {
    score += 0;  // no audits — neutral
  } else if (auditPassRate >= 90) {
    score += 5;
  } else if (auditPassRate >= 75) {
    score += 2;
  } else if (auditPassRate >= 60) {
    score += 0;
  } else if (auditPassRate >= 40) {
    score -= 3;
  } else {
    score -= 5;
  }

  // mod2: Error severity profile (±4)
  if (errors.length === 0) {
    score += 4;  // no errors — excellent
  } else if (majorHarm === 0 && moderateHarm === 0) {
    score += 2;  // only no-harm or minor
  } else if (majorHarm === 0) {
    score += 0;  // moderate but no major
  } else if (majorHarm <= 1) {
    score -= 2;
  } else {
    score -= 4;
  }

  // mod3: Near miss learning (±3)
  if (nearMisses.length === 0) {
    score += 1;  // no near misses — slightly positive
  } else if (avgLP >= 3 && pct(debriefedNM, nearMisses.length) >= 90) {
    score += 3;  // strong learning culture
  } else if (avgLP >= 2 && pct(debriefedNM, nearMisses.length) >= 70) {
    score += 1;
  } else if (pct(debriefedNM, nearMisses.length) >= 50) {
    score += 0;
  } else if (pct(debriefedNM, nearMisses.length) >= 30) {
    score -= 1;
  } else {
    score -= 3;
  }

  // mod4: Stock check compliance (±4)
  if (stockChecks.length === 0) {
    score += 0;  // no stock checks — neutral
  } else if (pct(stockBalanced, stockChecks.length) >= 90) {
    score += 4;
  } else if (pct(stockBalanced, stockChecks.length) >= 75) {
    score += 2;
  } else if (pct(stockBalanced, stockChecks.length) >= 60) {
    score += 0;
  } else if (pct(stockBalanced, stockChecks.length) >= 40) {
    score -= 2;
  } else {
    score -= 4;
  }

  // mod5: Storage audit verdicts (±3)
  if (storageAudits.length === 0) {
    score += 0;  // no storage audits — neutral
  } else if (stFail === 0 && stPassRate >= 90) {
    score += 3;
  } else if (stFail === 0 && stPassRate >= 70) {
    score += 1;
  } else if (stFail <= 1) {
    score += 0;
  } else if (stFail <= 2) {
    score -= 1;
  } else {
    score -= 3;
  }

  // mod6: Emergency protocol coverage (±3)
  if (emergencyProtocols.length === 0) {
    score += 0;  // no protocols — neutral (may not be needed)
  } else if (pct(gpSignedOff, emergencyProtocols.length) >= 90 && overdueReviews === 0) {
    score += 3;
  } else if (pct(gpSignedOff, emergencyProtocols.length) >= 70 && overdueReviews <= 1) {
    score += 1;
  } else if (pct(gpSignedOff, emergencyProtocols.length) >= 50) {
    score += 0;
  } else if (overdueReviews >= 2) {
    score -= 1;
  } else {
    score -= 3;
  }

  // mod7: Debrief culture (±3) — across errors and near misses combined
  const totalDebriefable = errors.length + nearMisses.length;
  const totalDebriefed = debriefedErrors + debriefedNM;
  const debriefRate = pct(totalDebriefed, totalDebriefable);
  if (totalDebriefable === 0) {
    score += 2;  // nothing to debrief — positive
  } else if (debriefRate >= 90) {
    score += 3;
  } else if (debriefRate >= 70) {
    score += 1;
  } else if (debriefRate >= 50) {
    score += 0;
  } else if (debriefRate >= 30) {
    score -= 1;
  } else {
    score -= 3;
  }

  // mod8: Controlled drugs governance (±3)
  if (storageAudits.length === 0) {
    score += 0;  // no data — neutral
  } else if (stCdCorrectRate >= 100 && stSecurityRate >= 100 && stKeysRate >= 100) {
    score += 3;
  } else if (stCdCorrectRate >= 90 && stSecurityRate >= 90) {
    score += 1;
  } else if (stCdCorrectRate >= 70) {
    score += 0;
  } else if (stCdCorrectRate >= 50) {
    score -= 1;
  } else {
    score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let governance_rating: MedicationGovernanceRating;
  if (score >= 80) governance_rating = "outstanding";
  else if (score >= 65) governance_rating = "good";
  else if (score >= 45) governance_rating = "adequate";
  else governance_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (audits.length > 0 && auditPassRate >= 90) strengths.push(`Audit pass rate at ${auditPassRate}% — medication audits demonstrate consistently high governance standards.`);
  if (errors.length === 0) strengths.push("No medication errors recorded — strong safety culture in medication management.");
  if (errors.length > 0 && errorProfile.root_cause_rate >= 90) strengths.push(`Root cause analysis completed for ${errorProfile.root_cause_rate}% of errors — thorough investigation practice embedded.`);
  if (nearMisses.length > 0 && nearMissProfile.debrief_rate >= 90) strengths.push(`Near miss debrief rate at ${nearMissProfile.debrief_rate}% — learning from near misses is embedded in practice.`);
  if (stockChecks.length > 0 && stock.balanced_rate >= 90) strengths.push(`Stock checks balanced at ${stock.balanced_rate}% — robust stock management and pharmacy liaison.`);
  if (storageAudits.length > 0 && stFail === 0 && stPassRate >= 90) strengths.push(`Storage audits achieving ${stPassRate}% pass rate with zero failures — excellent storage governance.`);
  if (emergencyProtocols.length > 0 && epProfile.gp_signed_off_rate >= 90 && overdueReviews === 0) strengths.push(`All emergency protocols GP-signed and reviews up to date — children with emergency medications are well protected.`);
  if (totalDebriefable > 0 && debriefRate >= 90) strengths.push(`Debrief culture at ${debriefRate}% — staff consistently learn from errors and near misses.`);
  if (storageAudits.length > 0 && stCdCorrectRate === 100 && stSecurityRate === 100 && stKeysRate === 100) strengths.push("Controlled drugs governance is exemplary — balances correct, security maintained, all keys accounted for.");

  // Concerns
  if (audits.length > 0 && auditPassRate < 60) concerns.push(`Audit pass rate at ${auditPassRate}% is critically low — medication governance falls below acceptable standards.`);
  if (auditFailCount > 0) concerns.push(`${auditFailCount} medication audit${auditFailCount > 1 ? "s" : ""} failed — discrepancies or storage issues require immediate attention.`);
  if (majorHarm > 0) concerns.push(`${majorHarm} major harm medication error${majorHarm > 1 ? "s" : ""} recorded — this is a serious safeguarding concern requiring immediate review.`);
  if (moderateHarm > 0) concerns.push(`${moderateHarm} moderate harm error${moderateHarm > 1 ? "s" : ""} — children have been affected by medication management failures.`);
  if (openInvestigations > 0) concerns.push(`${openInvestigations} medication error investigation${openInvestigations > 1 ? "s" : ""} still open — delays in closure increase regulatory risk.`);
  if (highCriticalNM > 0) concerns.push(`${highCriticalNM} high/critical near miss${highCriticalNM > 1 ? "es" : ""} — close calls that could have resulted in harm to children.`);
  if (stFail > 0) concerns.push(`${stFail} storage audit${stFail > 1 ? "s" : ""} failed requiring immediate action — medication storage is not meeting required standards.`);
  if (stTotalExpired > 0) concerns.push(`${stTotalExpired} expired medication item${stTotalExpired > 1 ? "s" : ""} found during storage audits — expired medications must not be available for administration.`);
  if (overdueReviews > 0) concerns.push(`${overdueReviews} emergency medication protocol${overdueReviews > 1 ? "s" : ""} overdue for review — children with emergency medications may not be adequately protected.`);
  if (ofstedNotifiable > 0) concerns.push(`${ofstedNotifiable} error${ofstedNotifiable > 1 ? "s" : ""} requiring Ofsted notification — regulatory reporting obligations must be met.`);
  if (storageAudits.length > 0 && stCdCorrectRate < 70) concerns.push(`Controlled drugs balance accuracy at ${stCdCorrectRate}% — discrepancies in controlled drug records are a serious governance failure.`);

  // Recommendations
  if (audits.length > 0 && auditPassRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Increase frequency of medication audits and implement corrective action plans for failed audits.", urgency: auditPassRate < 60 ? "immediate" : "soon", regulatory_ref: "Reg 12" });
  }
  if (errors.length > 0 && errorProfile.root_cause_rate < 80) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure root cause analysis is completed for every medication error — this is essential for preventing recurrence.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (errors.length > 0 && errorProfile.preventive_embedded_rate < 70) {
    recommendations.push({ rank: ++rank, recommendation: "Embed preventive actions from error investigations into daily practice — close the loop on lessons learned.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (openInvestigations > 0) {
    recommendations.push({ rank: ++rank, recommendation: `Close ${openInvestigations} outstanding medication error investigation${openInvestigations > 1 ? "s" : ""} and implement findings.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (nearMisses.length > 0 && nearMissProfile.debrief_rate < 70) {
    recommendations.push({ rank: ++rank, recommendation: "Hold debriefs for all near misses — near miss learning is a key indicator of proactive safety culture.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (stockChecks.length > 0 && stock.balanced_rate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Review stock check processes — high discrepancy rates indicate weaknesses in medication counting and recording.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (stFail > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address all failed storage audit findings immediately — ensure secure storage, correct temperature, and proper labelling.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (stOpenFollowUps > 0) {
    recommendations.push({ rank: ++rank, recommendation: `Complete ${stOpenFollowUps} open storage audit follow-up action${stOpenFollowUps > 1 ? "s" : ""} to maintain compliance.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (overdueReviews > 0) {
    recommendations.push({ rank: ++rank, recommendation: `Review ${overdueReviews} overdue emergency medication protocol${overdueReviews > 1 ? "s" : ""} with prescriber and update training records.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (emergencyProtocols.length > 0 && epProfile.gp_signed_off_rate < 80) {
    recommendations.push({ rank: ++rank, recommendation: "Obtain GP sign-off for all emergency medication protocols — unsigned protocols may not reflect current medical advice.", urgency: "soon", regulatory_ref: "Reg 12" });
  }

  // ARIA Insights
  if (audits.length > 0 && auditPassRate >= 90 && errors.length === 0 && stFail === 0 && totalDebriefable === 0) {
    insights.push({ text: "Medication governance is exemplary. High audit pass rates, zero errors, and clean storage audits demonstrate an embedded safety culture. This is a key strength for Ofsted inspection under Reg 12.", severity: "positive" });
  }
  if (majorHarm > 0 || (moderateHarm >= 2)) {
    insights.push({ text: `${majorHarm + moderateHarm} moderate/major harm medication error${(majorHarm + moderateHarm) > 1 ? "s" : ""} signal a systemic governance failure. Ofsted inspectors will examine whether leadership acted swiftly on root causes and whether children were safeguarded. This is likely to impact the Leadership & Management judgement.`, severity: "critical" });
  }
  if (errors.length > 0 && errorProfile.root_cause_rate >= 90 && errorProfile.preventive_embedded_rate >= 80) {
    insights.push({ text: `Despite ${errors.length} error${errors.length > 1 ? "s" : ""}, root cause analysis at ${errorProfile.root_cause_rate}% and preventive actions embedded at ${errorProfile.preventive_embedded_rate}% show a mature learning organisation. Ofsted will look favourably on how errors are used to drive improvement.`, severity: "positive" });
  }
  if (nearMisses.length >= 3 && nearMissProfile.debrief_rate >= 80 && avgLP >= 2) {
    insights.push({ text: `${nearMisses.length} near misses reported with ${nearMissProfile.debrief_rate}% debrief rate and average ${avgLP} learning points — the home has a healthy reporting culture. This is a sign of a learning organisation under SCCIF.`, severity: "positive" });
  }
  if (nearMisses.length >= 3 && nearMissProfile.debrief_rate < 50) {
    insights.push({ text: `${nearMisses.length} near misses recorded but only ${nearMissProfile.debrief_rate}% debriefed. Near misses are opportunities to prevent future harm — a weak debrief culture suggests lessons are not being embedded.`, severity: "warning" });
  }
  if (stFail >= 2) {
    insights.push({ text: `${stFail} failed storage audits indicate fundamental issues with medication storage arrangements. Under Reg 12, the registered person must ensure that medicines are stored safely. Multiple failures will trigger Ofsted concern.`, severity: "critical" });
  }
  if (storageAudits.length > 0 && stCdCorrectRate < 80) {
    insights.push({ text: `Controlled drugs balance accuracy at ${stCdCorrectRate}%. Discrepancies in controlled drug records are taken extremely seriously by regulators and could trigger a safeguarding concern or police referral.`, severity: "critical" });
  }
  if (overdueReviews >= 2) {
    insights.push({ text: `${overdueReviews} emergency medication protocols are overdue for review. Children with conditions requiring emergency medication (e.g. anaphylaxis, epilepsy) depend on current protocols and trained staff. Overdue reviews create a direct risk to life.`, severity: "critical" });
  }
  if (totalDebriefable > 0 && debriefRate >= 90) {
    insights.push({ text: `Debrief culture is strong at ${debriefRate}% across ${totalDebriefable} incident${totalDebriefable > 1 ? "s" : ""}. Consistent debriefing demonstrates that the home treats every medication incident as a learning opportunity — a hallmark of outstanding practice.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (governance_rating === "outstanding") {
    headline = `Medication governance is outstanding — ${audits.length > 0 ? auditPassRate + "% audit pass rate" : "strong compliance"} with ${errors.length === 0 ? "zero errors" : "effective error management"} and robust governance arrangements.`;
  } else if (governance_rating === "good") {
    headline = `Good medication governance — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement identified." : "minor refinements recommended."}`;
  } else if (governance_rating === "adequate") {
    headline = `Medication governance requires attention — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified that need addressing to meet expected standards.`;
  } else {
    headline = `Medication governance is inadequate — significant regulatory risks identified. ${majorHarm > 0 ? majorHarm + " major harm error" + (majorHarm > 1 ? "s" : "") + "." : ""} Immediate action required.`;
  }

  return {
    governance_rating,
    governance_score: score,
    headline,
    audit,
    errors: errorProfile,
    nearMisses: nearMissProfile,
    stock,
    storage,
    emergencyProtocols: epProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
