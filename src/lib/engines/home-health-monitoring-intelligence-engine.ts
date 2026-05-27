// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH MONITORING INTELLIGENCE ENGINE
// Home-level: synthesises annual health assessments, immunisation records,
// dental records, and health passports across all children to produce an
// overall health monitoring reachability and compliance intelligence.
// CHR 2015 Reg 10/15. SCCIF: "Health & Wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AnnualHealthAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;             // YYYY-MM-DD
  due_date: string;                    // YYYY-MM-DD
  completed_within_deadline: boolean;
  immunisations_up_to_date: boolean;
  dental_up_to_date: boolean;
  optical_up_to_date: boolean;
  recommendations_count: number;
  next_assessment_date: string;
  signed_off_by_la: boolean;
  report_shared: boolean;
}

export interface HealthPassportInput {
  id: string;
  child_id: string;
  last_updated: string;                // YYYY-MM-DD
  medications_count: number;
  conditions_count: number;
  immunisations_up_to_date: boolean;
  consent_status: string;
}

export interface ImmunisationInput {
  id: string;
  child_id: string;
  gp_registered: boolean;
  missed_count: number;
  caught_up_count: number;
  upcoming_due_count: number;
  child_consent: boolean;
  gp_reviewed: boolean;
}

export interface DentalInput {
  id: string;
  child_id: string;
  registration_status: string;         // registered | not_registered | waiting_list | transferred
  last_check_up_date: string;          // YYYY-MM-DD
  next_check_up_due: string;           // YYYY-MM-DD
  has_anxiety: boolean;
  adjustments_count: number;
}

export interface HomeHealthMonitoringInput {
  today: string;
  total_children: number;
  annual_health_assessments: AnnualHealthAssessmentInput[];
  health_passports: HealthPassportInput[];
  immunisations: ImmunisationInput[];
  dental_records: DentalInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HomeHealthMonitoringRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AssessmentProfile {
  total_assessments: number;
  recent_365d: number;
  children_assessed: number;
  completion_rate: number;             // % completed within deadline
  immunisations_up_to_date_rate: number;
  dental_up_to_date_rate: number;
  optical_up_to_date_rate: number;
  la_sign_off_rate: number;
  report_shared_rate: number;
  avg_recommendations: number;
}

export interface ImmunisationProfile {
  total_records: number;
  gp_registered_rate: number;
  missed_total: number;
  caught_up_total: number;
  upcoming_due_total: number;
  child_consent_rate: number;
  gp_reviewed_rate: number;
  catch_up_ratio: number;              // caught_up / missed (capped at 100)
}

export interface DentalProfile {
  total_records: number;
  registered_rate: number;
  overdue_checkups: number;
  anxiety_count: number;
  avg_adjustments: number;
  children_with_dental: number;
}

export interface PassportProfile {
  total_passports: number;
  currency_rate: number;               // % updated within 6 months
  avg_medications: number;
  avg_conditions: number;
  consent_given_rate: number;
  immunisations_up_to_date_rate: number;
}

export interface HealthMonitoringInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HealthMonitoringRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeHealthMonitoringResult {
  health_monitoring_rating: HomeHealthMonitoringRating;
  health_monitoring_score: number;
  headline: string;
  assessment: AssessmentProfile;
  immunisation: ImmunisationProfile;
  dental: DentalProfile;
  passport: PassportProfile;
  strengths: string[];
  concerns: string[];
  recommendations: HealthMonitoringRecommendation[];
  insights: HealthMonitoringInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HomeHealthMonitoringRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeHealthMonitoring(
  input: HomeHealthMonitoringInput,
): HomeHealthMonitoringResult {
  const { today, total_children, annual_health_assessments, health_passports, immunisations, dental_records } = input;

  // ── Insufficient data: no data at all ────────────────────────────────
  const totalDataPoints = annual_health_assessments.length + health_passports.length + immunisations.length + dental_records.length;
  if (totalDataPoints === 0) {
    return {
      health_monitoring_rating: "insufficient_data",
      health_monitoring_score: 0,
      headline: "Insufficient health monitoring data — ensure all children have documented assessments, immunisation records, dental records, and health passports.",
      assessment: emptyAssessment(),
      immunisation: emptyImmunisation(),
      dental: emptyDental(),
      passport: emptyPassport(),
      strengths: [],
      concerns: ["No health monitoring data recorded — this is a regulatory requirement under Reg 10/15."],
      recommendations: [{ rank: 1, recommendation: "Ensure every child has an annual health assessment, immunisation record, dental record, and health passport.", urgency: "immediate", regulatory_ref: "Reg 10/15" }],
      insights: [{ text: "Ofsted expects comprehensive health monitoring for every child. Without these records, the home cannot evidence compliance with Regulation 10/15.", severity: "critical" }],
    };
  }

  // ── Assessment Profile ────────────────────────────────────────────────
  const recent365 = annual_health_assessments.filter(a => {
    const d = daysBetween(a.assessment_date, today);
    return d >= 0 && d <= 365;
  });

  const childrenAssessed = [...new Set(recent365.map(a => a.child_id))].length;
  const completionRate = pct(recent365.filter(a => a.completed_within_deadline).length, recent365.length);
  const immunUpRate = pct(recent365.filter(a => a.immunisations_up_to_date).length, recent365.length);
  const dentalUpRate = pct(recent365.filter(a => a.dental_up_to_date).length, recent365.length);
  const opticalUpRate = pct(recent365.filter(a => a.optical_up_to_date).length, recent365.length);
  const laSignOffRate = pct(recent365.filter(a => a.signed_off_by_la).length, recent365.length);
  const reportSharedRate = pct(recent365.filter(a => a.report_shared).length, recent365.length);
  const avgRecs = recent365.length > 0
    ? Math.round((recent365.reduce((s, a) => s + a.recommendations_count, 0) / recent365.length) * 10) / 10
    : 0;

  const assessmentProfile: AssessmentProfile = {
    total_assessments: annual_health_assessments.length,
    recent_365d: recent365.length,
    children_assessed: childrenAssessed,
    completion_rate: completionRate,
    immunisations_up_to_date_rate: immunUpRate,
    dental_up_to_date_rate: dentalUpRate,
    optical_up_to_date_rate: opticalUpRate,
    la_sign_off_rate: laSignOffRate,
    report_shared_rate: reportSharedRate,
    avg_recommendations: avgRecs,
  };

  // ── Immunisation Profile ──────────────────────────────────────────────
  const gpRegistered = immunisations.filter(i => i.gp_registered).length;
  const totalMissed = immunisations.reduce((s, i) => s + i.missed_count, 0);
  const totalCaughtUp = immunisations.reduce((s, i) => s + i.caught_up_count, 0);
  const totalUpcoming = immunisations.reduce((s, i) => s + i.upcoming_due_count, 0);
  const childConsent = immunisations.filter(i => i.child_consent).length;
  const gpReviewed = immunisations.filter(i => i.gp_reviewed).length;
  const catchUpRatio = totalMissed > 0 ? Math.min(pct(totalCaughtUp, totalMissed), 100) : 100;

  const immunisationProfile: ImmunisationProfile = {
    total_records: immunisations.length,
    gp_registered_rate: pct(gpRegistered, immunisations.length),
    missed_total: totalMissed,
    caught_up_total: totalCaughtUp,
    upcoming_due_total: totalUpcoming,
    child_consent_rate: pct(childConsent, immunisations.length),
    gp_reviewed_rate: pct(gpReviewed, immunisations.length),
    catch_up_ratio: catchUpRatio,
  };

  // ── Dental Profile ────────────────────────────────────────────────────
  const registeredDental = dental_records.filter(d => d.registration_status === "registered").length;
  const overdueDental = dental_records.filter(d => {
    if (!d.next_check_up_due) return false;
    return daysBetween(d.next_check_up_due, today) > 0;
  }).length;
  const anxietyCount = dental_records.filter(d => d.has_anxiety).length;
  const avgAdjustments = dental_records.length > 0
    ? Math.round((dental_records.reduce((s, d) => s + d.adjustments_count, 0) / dental_records.length) * 10) / 10
    : 0;
  const childrenWithDental = [...new Set(dental_records.map(d => d.child_id))].length;

  const dentalProfile: DentalProfile = {
    total_records: dental_records.length,
    registered_rate: pct(registeredDental, dental_records.length),
    overdue_checkups: overdueDental,
    anxiety_count: anxietyCount,
    avg_adjustments: avgAdjustments,
    children_with_dental: childrenWithDental,
  };

  // ── Passport Profile ──────────────────────────────────────────────────
  const currentPassports = health_passports.filter(p => {
    const d = daysBetween(p.last_updated, today);
    return d >= 0 && d <= 182; // ~6 months
  }).length;
  const currencyRate = pct(currentPassports, health_passports.length);
  const avgMeds = health_passports.length > 0
    ? Math.round((health_passports.reduce((s, p) => s + p.medications_count, 0) / health_passports.length) * 10) / 10
    : 0;
  const avgConditions = health_passports.length > 0
    ? Math.round((health_passports.reduce((s, p) => s + p.conditions_count, 0) / health_passports.length) * 10) / 10
    : 0;
  const consentGiven = health_passports.filter(p => p.consent_status === "given" || p.consent_status === "consented").length;
  const passportImmunUp = health_passports.filter(p => p.immunisations_up_to_date).length;

  const passportProfile: PassportProfile = {
    total_passports: health_passports.length,
    currency_rate: currencyRate,
    avg_medications: avgMeds,
    avg_conditions: avgConditions,
    consent_given_rate: pct(consentGiven, health_passports.length),
    immunisations_up_to_date_rate: pct(passportImmunUp, health_passports.length),
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 → outstanding threshold
  let score = 52;

  // 1. AHA completion rate (±5)
  const ahaCompRate = pct(childrenAssessed, total_children);
  if (ahaCompRate === 100) score += 5;
  else if (ahaCompRate >= 80) score += 2;
  else if (ahaCompRate < 50) score -= 5;
  else score -= 2;

  // 2. Immunisation coverage (±4)
  const immunCoverage = pct(immunisations.filter(i => !i.missed_count || i.caught_up_count >= i.missed_count).length, immunisations.length);
  if (immunCoverage === 100) score += 4;
  else if (immunCoverage >= 80) score += 2;
  else if (immunCoverage < 50) score -= 4;
  else score -= 1;

  // 3. Dental registration (±4)
  const dentalRegRate = pct(registeredDental, dental_records.length);
  if (dentalRegRate === 100) score += 4;
  else if (dentalRegRate >= 80) score += 2;
  else if (dentalRegRate < 50) score -= 4;
  else score -= 1;

  // 4. Health passport currency (±3) — updated within 6 months
  if (currencyRate === 100) score += 3;
  else if (currencyRate >= 80) score += 1;
  else if (currencyRate < 50) score -= 3;
  else score -= 1;

  // 5. AHA timeliness (±3) — completed_within_deadline
  if (completionRate === 100 && recent365.length > 0) score += 3;
  else if (completionRate >= 80) score += 1;
  else if (completionRate < 50 && recent365.length > 0) score -= 3;
  else if (recent365.length > 0) score -= 1;

  // 6. Optical check coverage (±3)
  if (opticalUpRate === 100 && recent365.length > 0) score += 3;
  else if (opticalUpRate >= 80) score += 1;
  else if (opticalUpRate < 50 && recent365.length > 0) score -= 3;
  else if (recent365.length > 0) score -= 1;

  // 7. Child consent / participation (±3)
  const consentRate = pct(childConsent, immunisations.length);
  if (consentRate === 100 && immunisations.length > 0) score += 3;
  else if (consentRate >= 80) score += 1;
  else if (consentRate < 50 && immunisations.length > 0) score -= 3;
  else if (immunisations.length > 0) score -= 1;

  // 8. LA sign-off compliance (±3)
  if (laSignOffRate === 100 && recent365.length > 0) score += 3;
  else if (laSignOffRate >= 80) score += 1;
  else if (laSignOffRate < 50 && recent365.length > 0) score -= 3;
  else if (recent365.length > 0) score -= 1;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (ahaCompRate === 100 && total_children > 0) strengths.push("All children have annual health assessments completed within the last 12 months — Reg 10 compliance evidenced.");
  if (completionRate === 100 && recent365.length > 0) strengths.push("100% of assessments completed within deadline — excellent timeliness.");
  if (immunCoverage === 100 && immunisations.length > 0) strengths.push("Full immunisation coverage — all children are up to date or caught up during placement.");
  if (dentalRegRate === 100 && dental_records.length > 0) strengths.push("All children registered with a dental practice.");
  if (currencyRate === 100 && health_passports.length > 0) strengths.push("All health passports updated within the last 6 months — comprehensive and current records.");
  if (opticalUpRate === 100 && recent365.length > 0) strengths.push("All children have optical checks up to date.");
  if (laSignOffRate === 100 && recent365.length > 0) strengths.push("100% LA sign-off on health assessments — strong multi-agency compliance.");
  if (consentRate === 100 && immunisations.length > 0) strengths.push("All children have given informed consent for immunisation decisions — excellent participation.");
  if (overdueDental === 0 && dental_records.length > 0) strengths.push("No overdue dental check-ups — all appointments on schedule.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  const childrenNotAssessed = total_children - childrenAssessed;
  if (childrenNotAssessed > 0 && total_children > 0) concerns.push(`${childrenNotAssessed} child${childrenNotAssessed > 1 ? "ren" : ""} without a health assessment in the last 12 months — statutory requirement.`);
  if (completionRate < 80 && recent365.length > 0) concerns.push(`Only ${completionRate}% of assessments completed within deadline — timeliness needs improvement.`);
  if (totalMissed > 0 && catchUpRatio < 100) concerns.push(`${totalMissed} missed immunisation${totalMissed > 1 ? "s" : ""} across children with only ${catchUpRatio}% catch-up rate.`);
  if (overdueDental > 0) concerns.push(`${overdueDental} overdue dental check-up${overdueDental > 1 ? "s" : ""} — 6-monthly dental reviews are expected.`);
  if (currencyRate < 80 && health_passports.length > 0) concerns.push(`Only ${currencyRate}% of health passports updated within 6 months — passports should be kept current.`);
  if (dentalRegRate < 80 && dental_records.length > 0) concerns.push(`Only ${dentalRegRate}% dental registration rate — all children should be registered with a dentist.`);
  if (opticalUpRate < 80 && recent365.length > 0) concerns.push(`Only ${opticalUpRate}% optical check coverage — annual eye tests are expected.`);
  if (laSignOffRate < 80 && recent365.length > 0) concerns.push(`Only ${laSignOffRate}% LA sign-off rate — all health assessments should be signed off by the placing authority.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: HealthMonitoringRecommendation[] = [];
  let rank = 1;

  if (childrenNotAssessed > 0 && total_children > 0) {
    recs.push({ rank: rank++, recommendation: `Book annual health assessments for ${childrenNotAssessed} child${childrenNotAssessed > 1 ? "ren" : ""} without recent assessment — statutory requirement under Reg 10.`, urgency: "immediate", regulatory_ref: "Reg 10" });
  }
  if (totalMissed > 0 && catchUpRatio < 80) {
    recs.push({ rank: rank++, recommendation: "Work with GP to develop catch-up immunisation schedule for children with missed vaccinations.", urgency: "immediate", regulatory_ref: "Reg 10/15" });
  }
  if (overdueDental > 0) {
    recs.push({ rank: rank++, recommendation: `Arrange dental appointments for ${overdueDental} overdue check-up${overdueDental > 1 ? "s" : ""}.`, urgency: "soon", regulatory_ref: "Reg 10" });
  }
  if (currencyRate < 80 && health_passports.length > 0) {
    recs.push({ rank: rank++, recommendation: "Update health passports to ensure all are current within 6 months — include medication, allergy, and condition changes.", urgency: "soon", regulatory_ref: "Reg 10/15" });
  }
  if (dentalRegRate < 100 && dental_records.length > 0) {
    recs.push({ rank: rank++, recommendation: "Register all children with a dental practice — pursue waiting list or transfer options if needed.", urgency: "soon", regulatory_ref: "Reg 10" });
  }
  if (laSignOffRate < 100 && recent365.length > 0) {
    recs.push({ rank: rank++, recommendation: "Chase LA sign-off for outstanding health assessments — this is required for multi-agency compliance.", urgency: "planned", regulatory_ref: "Reg 10" });
  }
  if (opticalUpRate < 80 && recent365.length > 0) {
    recs.push({ rank: rank++, recommendation: "Schedule optical checks for children without recent eye tests.", urgency: "planned", regulatory_ref: "Reg 10" });
  }
  if (anxietyCount > 0) {
    recs.push({ rank: rank++, recommendation: `${anxietyCount} child${anxietyCount > 1 ? "ren" : ""} with dental anxiety — ensure reasonable adjustments and desensitisation plans are in place.`, urgency: "planned", regulatory_ref: "Reg 10" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: HealthMonitoringInsight[] = [];

  if (childrenNotAssessed > 0 && total_children > 0) {
    insights.push({ text: `${childrenNotAssessed} child${childrenNotAssessed > 1 ? "ren have" : " has"} no annual health assessment in 12 months. Ofsted will view this as a failure to promote health outcomes under Regulation 10.`, severity: "critical" });
  }
  if (totalMissed > 0 && catchUpRatio < 50) {
    insights.push({ text: `${totalMissed} missed immunisations with only ${catchUpRatio}% catch-up. This pattern suggests systemic gaps in immunisation tracking.`, severity: "critical" });
  }
  if (overdueDental >= 2) {
    insights.push({ text: `${overdueDental} overdue dental appointments. Dental neglect is a safeguarding indicator — Ofsted expects 6-monthly dental reviews.`, severity: "warning" });
  }
  if (currencyRate < 50 && health_passports.length > 0) {
    insights.push({ text: `Only ${currencyRate}% of health passports are current. Outdated passports risk missed allergies, medications, or conditions in emergency situations.`, severity: "warning" });
  }
  if (ahaCompRate === 100 && completionRate === 100 && total_children > 0) {
    insights.push({ text: "All children assessed on time with 100% completion rate. This is outstanding evidence of proactive health monitoring.", severity: "positive" });
  }
  if (immunCoverage === 100 && dentalRegRate === 100 && immunisations.length > 0 && dental_records.length > 0) {
    insights.push({ text: "Full immunisation coverage and dental registration — the home is meeting all statutory health requirements.", severity: "positive" });
  }
  if (currencyRate === 100 && health_passports.length > 0 && consentRate === 100 && immunisations.length > 0) {
    insights.push({ text: "All health passports current and all children consenting — demonstrates child-centred, well-coordinated health management.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding health monitoring — comprehensive assessments, full immunisation coverage, and current health passports across all children.";
  } else if (rating === "good") {
    headline = `Good health monitoring — ${childrenAssessed} of ${total_children} children assessed with ${completionRate}% timeliness.`;
  } else if (rating === "adequate") {
    headline = "Adequate health monitoring — some gaps in assessment coverage, immunisation, or dental registration need attention.";
  } else {
    headline = "Health monitoring is inadequate — significant gaps in assessments, immunisation coverage, or dental registration require urgent action.";
  }

  return {
    health_monitoring_rating: rating,
    health_monitoring_score: score,
    headline,
    assessment: assessmentProfile,
    immunisation: immunisationProfile,
    dental: dentalProfile,
    passport: passportProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyAssessment(): AssessmentProfile {
  return {
    total_assessments: 0, recent_365d: 0, children_assessed: 0,
    completion_rate: 0, immunisations_up_to_date_rate: 0,
    dental_up_to_date_rate: 0, optical_up_to_date_rate: 0,
    la_sign_off_rate: 0, report_shared_rate: 0, avg_recommendations: 0,
  };
}

function emptyImmunisation(): ImmunisationProfile {
  return {
    total_records: 0, gp_registered_rate: 0,
    missed_total: 0, caught_up_total: 0, upcoming_due_total: 0,
    child_consent_rate: 0, gp_reviewed_rate: 0, catch_up_ratio: 100,
  };
}

function emptyDental(): DentalProfile {
  return {
    total_records: 0, registered_rate: 0,
    overdue_checkups: 0, anxiety_count: 0, avg_adjustments: 0,
    children_with_dental: 0,
  };
}

function emptyPassport(): PassportProfile {
  return {
    total_passports: 0, currency_rate: 0,
    avg_medications: 0, avg_conditions: 0,
    consent_given_rate: 0, immunisations_up_to_date_rate: 0,
  };
}
