// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LONE WORKING STAFF SAFETY INTELLIGENCE ENGINE
// Pure deterministic engine: lone working records, assessments, safety checks.
// CHR 2015 Reg 33, HSE Lone Working guidance.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LoneWorkingRecordInput {
  id: string;
  staff_id: string;
  risk_level: string; // "low"|"medium"|"high"
  status: string; // "current"|"expired"|"under_review"
  has_check_in_protocol: boolean;
  personal_alarm_issued: boolean;
  control_measures_count: number;
  hazards_count: number;
}

export interface LoneWorkingAssessmentInput {
  id: string;
  staff_id: string;
  overall_risk: string; // "low"|"medium"|"high"
  scenarios_count: number;
  competency_evidence_count: number;
  training_valid_count: number;
  training_total_count: number;
  approved_shifts_count: number;
}

export interface StaffSafetyCheckInput {
  id: string;
  staff_id: string;
  check_completed: boolean;
  response_timely: boolean;
}

export interface LoneWorkingSafetyInput {
  today: string;
  total_staff: number;
  records: LoneWorkingRecordInput[];
  assessments: LoneWorkingAssessmentInput[];
  safety_checks: StaffSafetyCheckInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LoneWorkingSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LoneWorkingSafetyResult {
  safety_rating: LoneWorkingSafetyRating;
  safety_score: number;
  headline: string;
  staff_with_assessments: number;
  alarm_coverage_rate: number;
  check_in_compliance_rate: number;
  training_validity_rate: number;
  high_risk_staff: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function ratingFromScore(score: number): LoneWorkingSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeLoneWorkingStaffSafety(
  input: LoneWorkingSafetyInput,
): LoneWorkingSafetyResult {
  const { total_staff, records, assessments, safety_checks } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0) {
    return {
      safety_rating: "insufficient_data",
      safety_score: 0,
      headline: "No staff registered — unable to assess lone working safety.",
      staff_with_assessments: 0,
      alarm_coverage_rate: 0,
      check_in_compliance_rate: 0,
      training_validity_rate: 0,
      high_risk_staff: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────
  const uniqueStaffInRecords = new Set(records.map((r) => r.staff_id));
  const staff_with_assessments = uniqueStaffInRecords.size;

  const alarmsIssued = records.filter((r) => r.personal_alarm_issued).length;
  const alarm_coverage_rate = pct(alarmsIssued, records.length);

  const withCheckIn = records.filter((r) => r.has_check_in_protocol).length;
  const check_in_compliance_rate = pct(withCheckIn, records.length);

  const totalTrainingValid = assessments.reduce((s, a) => s + a.training_valid_count, 0);
  const totalTrainingTotal = assessments.reduce((s, a) => s + a.training_total_count, 0);
  const training_validity_rate = pct(totalTrainingValid, totalTrainingTotal);

  const highRiskStaffIds = new Set(
    records.filter((r) => r.risk_level === "high").map((r) => r.staff_id),
  );
  const high_risk_staff = highRiskStaffIds.size;

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Assessment coverage (unique staff with records / total_staff) (+-5)
  const assessmentCoverage = pct(staff_with_assessments, total_staff);
  const mod1 =
    assessmentCoverage >= 90 ? 5 :
    assessmentCoverage >= 60 ? 2 :
    assessmentCoverage >= 30 ? 0 : -5;
  score += mod1;

  // mod2: Alarm coverage (personal_alarm_issued %) (+6/-5)
  const mod2 =
    records.length === 0 ? 0 :
    alarm_coverage_rate >= 95 ? 6 :
    alarm_coverage_rate >= 80 ? 3 :
    alarm_coverage_rate >= 50 ? 0 : -5;
  score += mod2;

  // mod3: Check-in compliance (has_check_in_protocol %) (+5/-4)
  const mod3 =
    records.length === 0 ? 0 :
    check_in_compliance_rate >= 95 ? 5 :
    check_in_compliance_rate >= 80 ? 2 :
    check_in_compliance_rate >= 50 ? 0 : -4;
  score += mod3;

  // mod4: Training validity (training_valid / training_total across assessments) (+5/-5)
  const mod4 =
    assessments.length === 0 ? -1 :
    training_validity_rate >= 90 ? 5 :
    training_validity_rate >= 70 ? 2 :
    training_validity_rate >= 40 ? 0 : -5;
  score += mod4;

  // mod5: Risk profile (low risk / total records) (+4/-4)
  const lowRiskCount = records.filter((r) => r.risk_level === "low").length;
  const lowRiskRate = pct(lowRiskCount, records.length);
  const mod5 =
    records.length === 0 ? 0 :
    lowRiskRate >= 80 ? 4 :
    lowRiskRate >= 60 ? 1 :
    lowRiskRate >= 30 ? 0 : -4;
  score += mod5;

  // mod6: Safety check response (timely checks / total checks) (+5/-5)
  const timelyChecks = safety_checks.filter((c) => c.response_timely).length;
  const timelyRate = pct(timelyChecks, safety_checks.length);
  const mod6 =
    safety_checks.length === 0 ? 2 :
    timelyRate >= 95 ? 5 :
    timelyRate >= 80 ? 2 :
    timelyRate >= 50 ? 0 : -5;
  score += mod6;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const safety_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (assessmentCoverage >= 90) {
    strengths.push(`${assessmentCoverage}% of staff have lone working records — excellent assessment coverage.`);
  }
  if (alarm_coverage_rate >= 95 && records.length > 0) {
    strengths.push(`${alarm_coverage_rate}% personal alarm coverage — all lone workers are equipped with safety alarms.`);
  }
  if (check_in_compliance_rate >= 95 && records.length > 0) {
    strengths.push(`${check_in_compliance_rate}% of lone working arrangements include check-in protocols — strong communication safeguards.`);
  }
  if (training_validity_rate >= 90 && assessments.length > 0) {
    strengths.push(`${training_validity_rate}% training validity rate — staff are well-trained for lone working duties.`);
  }
  if (lowRiskRate >= 80 && records.length > 0) {
    strengths.push(`${lowRiskRate}% of lone working records are low risk — effective risk mitigation in place.`);
  }
  if (timelyRate >= 95 && safety_checks.length > 0) {
    strengths.push(`${timelyRate}% of safety checks received timely responses — reliable staff welfare monitoring.`);
  }
  if (high_risk_staff === 0 && records.length > 0) {
    strengths.push("No staff currently assigned to high-risk lone working scenarios.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (assessmentCoverage < 30 && total_staff > 0) {
    concerns.push(`Only ${assessmentCoverage}% of staff have lone working assessments — significant safety gaps exist.`);
  }
  if (alarm_coverage_rate < 50 && records.length > 0) {
    concerns.push(`Only ${alarm_coverage_rate}% of lone workers have personal alarms — inadequate safety equipment provision.`);
  }
  if (check_in_compliance_rate < 50 && records.length > 0) {
    concerns.push(`Only ${check_in_compliance_rate}% of lone working arrangements have check-in protocols — staff welfare at risk.`);
  }
  if (training_validity_rate < 40 && assessments.length > 0) {
    concerns.push(`Only ${training_validity_rate}% of required training is current — staff may lack competency for lone working.`);
  }
  if (high_risk_staff > 0) {
    concerns.push(`${high_risk_staff} staff member${high_risk_staff !== 1 ? "s" : ""} assigned to high-risk lone working — enhanced monitoring required.`);
  }
  if (timelyRate < 50 && safety_checks.length > 0) {
    concerns.push(`Only ${timelyRate}% of safety checks received timely responses — welfare check system may be failing.`);
  }
  if (records.length === 0 && total_staff > 0) {
    concerns.push("No lone working records exist — staff working alone may be unassessed and unprotected.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: LoneWorkingSafetyResult["recommendations"] = [];
  let rank = 0;

  if (alarm_coverage_rate < 50 && records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Issue personal alarms to all lone workers immediately to meet health and safety obligations.",
      urgency: "immediate",
      regulatory_ref: "HSE Lone Working",
    });
  }
  if (check_in_compliance_rate < 50 && records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Establish check-in protocols for all lone working arrangements to ensure staff can raise the alarm.",
      urgency: "immediate",
      regulatory_ref: "HSE Lone Working",
    });
  }
  if (training_validity_rate < 40 && assessments.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Renew expired lone working training to ensure all staff are competent to work alone safely.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (timelyRate < 50 && safety_checks.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review the safety check process — fewer than half of checks are receiving timely responses.",
      urgency: "immediate",
      regulatory_ref: "HSE Lone Working",
    });
  }
  if (assessmentCoverage < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Extend lone working assessments to cover all staff who may work alone — aim for 100% coverage.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (recommendations.length < 5 && high_risk_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review risk controls for ${high_risk_staff} high-risk lone working arrangement${high_risk_staff !== 1 ? "s" : ""} and consider additional safeguards.`,
      urgency: "soon",
      regulatory_ref: "HSE Lone Working",
    });
  }
  if (recommendations.length < 5 && assessments.length === 0 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct lone working competency assessments for all staff to evidence training and readiness.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (recommendations.length < 5 && records.length === 0 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Create lone working records for all staff who may work alone — this is a fundamental safety requirement.",
      urgency: "soon",
      regulatory_ref: "HSE Lone Working",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: LoneWorkingSafetyResult["insights"] = [];

  if (alarm_coverage_rate < 50 && high_risk_staff > 0) {
    insights.push({
      text: `High-risk lone working identified but alarm coverage below 50% — a critical safety gap that requires immediate attention.`,
      severity: "critical",
    });
  }
  if (records.length === 0 && total_staff > 0) {
    insights.push({
      text: "No lone working records exist for any staff. This represents a fundamental gap in health and safety compliance.",
      severity: "critical",
    });
  }
  if (timelyRate < 50 && safety_checks.length > 0) {
    insights.push({
      text: `Only ${timelyRate}% of safety checks are timely — the welfare check system may not protect staff in an emergency.`,
      severity: "warning",
    });
  }

  if (insights.length < 3 && training_validity_rate < 40 && assessments.length > 0) {
    insights.push({
      text: `Training validity at ${training_validity_rate}% — staff may be working alone without current competency evidence.`,
      severity: "warning",
    });
  }

  if (insights.length < 3 && assessmentCoverage >= 90 && alarm_coverage_rate >= 95 && records.length > 0) {
    insights.push({
      text: "Comprehensive lone working coverage with excellent alarm provision — robust safety framework in place.",
      severity: "positive",
    });
  }
  if (insights.length < 3 && timelyRate >= 95 && safety_checks.length > 0) {
    insights.push({
      text: `${timelyRate}% timely safety check responses — staff welfare monitoring is reliable and effective.`,
      severity: "positive",
    });
  }
  if (insights.length < 3 && training_validity_rate >= 90 && check_in_compliance_rate >= 95 && records.length > 0 && assessments.length > 0) {
    insights.push({
      text: "Strong training validity combined with comprehensive check-in protocols demonstrates a mature lone working safety culture.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    safety_rating === "outstanding"
      ? "Exceptional lone working safety — comprehensive coverage, strong alarm provision, and reliable welfare checks."
      : safety_rating === "good"
      ? "Good lone working safety framework with minor areas for improvement."
      : safety_rating === "adequate"
      ? "Lone working safety measures are adequate but gaps in coverage, equipment, or training need attention."
      : safety_rating === "insufficient_data"
      ? "No staff registered — unable to assess lone working safety."
      : "Significant lone working safety concerns — gaps in assessments, alarms, or welfare checks require urgent action.";

  return {
    safety_rating,
    safety_score: score,
    headline,
    staff_with_assessments,
    alarm_coverage_rate,
    check_in_compliance_rate,
    training_validity_rate,
    high_risk_staff,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
