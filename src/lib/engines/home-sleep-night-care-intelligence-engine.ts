// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SLEEP & NIGHT CARE INTELLIGENCE ENGINE
// Home-level: aggregates sleep logs covering waking night and sleep-in shifts,
// welfare check compliance, building security, alarm compliance, disturbance
// patterns, handover quality, and overnight response effectiveness.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (Protection of children), Reg 6 (Quality of care).
// SCCIF: Health and wellbeing; Helped and protected.
// National Minimum Standards 7.9 (night care arrangements).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SleepNightCareRecordInput {
  id: string;
  date: string;                        // ISO date YYYY-MM-DD
  shift_type: string;                  // "waking_night" | "sleep_in"
  disturbance_level: string;           // "none" | "minor" | "moderate" | "significant"
  disturbance_count: number;
  children_disturbed_count: number;    // unique YP in disturbances
  total_disturbance_duration_minutes: number;
  checks_completed_count: number;
  expected_checks_count: number;       // waking_night=5, sleep_in=2
  building_secure: boolean;
  alarms_set: boolean;
  has_handover_notes: boolean;
  has_morning_handover: boolean;
  all_disturbances_have_action: boolean; // every disturbance has action_taken
}

export interface SleepNightCareInput {
  today: string;
  total_children: number;
  logs: SleepNightCareRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SleepNightCareRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SleepNightCareResult {
  sleep_rating: SleepNightCareRating;
  sleep_score: number | null;
  headline: string;

  total_logs: number;
  waking_night_count: number;
  sleep_in_count: number;

  check_compliance_rate: number | null;
  building_security_rate: number | null;
  alarm_compliance_rate: number | null;
  disturbance_response_rate: number | null;
  quiet_night_rate: number | null;
  significant_disturbance_count: number;
  handover_quality_rate: number | null;
  average_disturbance_duration: number | null;

  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string | null }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const pct = (n: number, d: number) => d === 0 ? 0 : Math.round((n / d) * 100);

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeSleepNightCare(
  input: SleepNightCareInput,
): SleepNightCareResult {
  const { today, total_children, logs } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || logs.length === 0) {
    return {
      sleep_rating: "insufficient_data",
      sleep_score: 0,
      headline: total_children === 0
        ? "No children registered in the home — night care analysis unavailable."
        : "No sleep or night care logs recorded — unable to assess overnight care quality.",
      total_logs: 0,
      waking_night_count: 0,
      sleep_in_count: 0,
      check_compliance_rate: 0,
      building_security_rate: 0,
      alarm_compliance_rate: 0,
      disturbance_response_rate: 0,
      quiet_night_rate: 0,
      significant_disturbance_count: 0,
      handover_quality_rate: 0,
      average_disturbance_duration: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Aggregate metrics ─────────────────────────────────────────────────

  const totalLogs = logs.length;
  const wakingNightCount = logs.filter(l => l.shift_type === "waking_night").length;
  const sleepInCount = logs.filter(l => l.shift_type === "sleep_in").length;

  // Check compliance: total checks completed / total expected checks across all logs
  const totalChecksCompleted = logs.reduce((s, l) => s + l.checks_completed_count, 0);
  const totalExpectedChecks = logs.reduce((s, l) => s + l.expected_checks_count, 0);
  const checkComplianceRate = pct(totalChecksCompleted, totalExpectedChecks);

  // Building security
  const buildingSecureCount = logs.filter(l => l.building_secure).length;
  const buildingSecurityRate = pct(buildingSecureCount, totalLogs);

  // Alarm compliance
  const alarmsSetCount = logs.filter(l => l.alarms_set).length;
  const alarmComplianceRate = pct(alarmsSetCount, totalLogs);

  // Disturbance response: among logs that HAVE disturbances, rate of all_disturbances_have_action
  const logsWithDisturbances = logs.filter(l => l.disturbance_count > 0);
  const logsWithFullResponse = logsWithDisturbances.filter(l => l.all_disturbances_have_action).length;
  const disturbanceResponseRate = pct(logsWithFullResponse, logsWithDisturbances.length);

  // Quiet nights: disturbance_level === "none"
  const quietNights = logs.filter(l => l.disturbance_level === "none").length;
  const quietNightRate = pct(quietNights, totalLogs);

  // Significant disturbance count
  const significantDisturbanceCount = logs.filter(l => l.disturbance_level === "significant").length;

  // Handover quality: has_handover_notes AND has_morning_handover
  const logsWithFullHandover = logs.filter(l => l.has_handover_notes && l.has_morning_handover).length;
  const handoverQualityRate = pct(logsWithFullHandover, totalLogs);

  // Average disturbance duration (across logs that have disturbances)
  const totalDisturbanceDuration = logs.reduce((s, l) => s + l.total_disturbance_duration_minutes, 0);
  const totalDisturbanceCount = logs.reduce((s, l) => s + l.disturbance_count, 0);
  const averageDisturbanceDuration = totalDisturbanceCount > 0
    ? Math.round((totalDisturbanceDuration / totalDisturbanceCount) * 10) / 10
    : null;

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 6 modifiers
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Check Compliance (+6/+3/0/-3/-5) ──────────────────────────
  {
    if (checkComplianceRate >= 95) score += 6;
    else if (checkComplianceRate >= 80) score += 3;
    else if (checkComplianceRate < 50) score -= 5;
    // 0 logs with children case already handled by insufficient_data guard
    // but if logs exist with 0 checks across the board (rate would be 0 < 50) → -5
  }

  // ── Mod 2: Building Security & Alarm Compliance (+5/+2/-1/-5) ────────
  {
    if (buildingSecurityRate >= 98 && alarmComplianceRate >= 98) score += 5;
    else if (buildingSecurityRate >= 90 || alarmComplianceRate >= 90) score += 2;
    else if (buildingSecurityRate < 70 || alarmComplianceRate < 70) score -= 5;
    else score -= 1;
  }

  // ── Mod 3: Disturbance Response (+5/+2/+2/-4) ────────────────────────
  {
    if (logsWithDisturbances.length === 0) {
      // No disturbances at all — all quiet, minor positive
      score += 2;
    } else {
      if (disturbanceResponseRate >= 95) score += 5;
      else if (disturbanceResponseRate >= 80) score += 2;
      else if (disturbanceResponseRate < 50) score -= 4;
    }
  }

  // ── Mod 4: Handover Quality (+5/+2/-1/-4) ────────────────────────────
  {
    if (handoverQualityRate >= 90) score += 5;
    else if (handoverQualityRate >= 70) score += 2;
    else if (handoverQualityRate < 40) score -= 4;
    else score -= 1;
  }

  // ── Mod 5: Quiet Nights (+4/+2/-1/-4) ────────────────────────────────
  {
    if (quietNightRate >= 70) score += 4;
    else if (quietNightRate >= 50) score += 2;
    else if (quietNightRate < 20) score -= 4;
    else score -= 1;
  }

  // ── Mod 6: Overall Pattern + Significant Events (+5/+2/-2/-3) ────────
  {
    if (significantDisturbanceCount === 0 && checkComplianceRate >= 90) score += 5;
    else if (significantDisturbanceCount <= 1 || checkComplianceRate >= 80) score += 2;
    else if (significantDisturbanceCount > 3 || checkComplianceRate < 60) score -= 3;
    else score -= 2;
  }

  // ── Clamp ─────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let sleep_rating: SleepNightCareRating;
  if (score >= 80) sleep_rating = "outstanding";
  else if (score >= 65) sleep_rating = "good";
  else if (score >= 45) sleep_rating = "adequate";
  else sleep_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: SleepNightCareResult["recommendations"] = [];
  const insights: SleepNightCareResult["insights"] = [];
  let rank = 0;

  // ── Strengths ─────────────────────────────────────────────────────────

  if (checkComplianceRate >= 95) {
    strengths.push(`Excellent welfare check compliance at ${checkComplianceRate}% — all scheduled overnight checks are being completed consistently.`);
  } else if (checkComplianceRate >= 80) {
    strengths.push(`Good welfare check compliance at ${checkComplianceRate}% — the majority of scheduled overnight checks are completed.`);
  }

  if (buildingSecurityRate >= 98 && alarmComplianceRate >= 98) {
    strengths.push("Building security and alarm compliance are both at or near 100% — the home is consistently secured overnight.");
  }

  if (quietNightRate >= 70) {
    strengths.push(`${quietNightRate}% of nights are undisturbed — children are sleeping well and the overnight environment is calm.`);
  }

  if (logsWithDisturbances.length > 0 && disturbanceResponseRate >= 95) {
    strengths.push(`${disturbanceResponseRate}% of disturbances have documented response actions — staff are responding to and recording every overnight incident.`);
  }

  if (logsWithDisturbances.length === 0) {
    strengths.push("No disturbances recorded across all logged nights — children are settled and the home provides a calm sleeping environment.");
  }

  if (handoverQualityRate >= 90) {
    strengths.push(`${handoverQualityRate}% of shifts have complete handover documentation — strong continuity of care between night and day staff.`);
  }

  if (significantDisturbanceCount === 0 && totalLogs >= 5) {
    strengths.push("Zero significant disturbances recorded — no overnight events have required escalation or intensive intervention.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  // CRITICAL: significant disturbance pattern concern
  if (significantDisturbanceCount > 2) {
    concerns.push(`${significantDisturbanceCount} nights with significant disturbances recorded — this pattern suggests persistent overnight difficulties that require clinical review and may indicate unmet therapeutic needs.`);
  }

  // CRITICAL: check compliance safety concern
  if (checkComplianceRate < 80) {
    concerns.push(`Welfare check compliance is only ${checkComplianceRate}% — below the 80% safety threshold. Incomplete overnight checks mean children's safety and wellbeing cannot be fully evidenced.`);
  }

  // CRITICAL: building security failures — immediate concern
  if (buildingSecureCount < totalLogs) {
    const failureCount = totalLogs - buildingSecureCount;
    concerns.push(`Building security was not confirmed on ${failureCount} of ${totalLogs} nights — any failure to secure the building overnight is an immediate safeguarding concern.`);
  }

  if (alarmComplianceRate < 90) {
    concerns.push(`Alarm compliance is only ${alarmComplianceRate}% — alarms should be set on every night to ensure children's physical safety.`);
  }

  if (logsWithDisturbances.length > 0 && disturbanceResponseRate < 80) {
    concerns.push(`Only ${disturbanceResponseRate}% of disturbances have a documented response action — staff must record how they responded to every overnight disturbance.`);
  }

  if (handoverQualityRate < 40) {
    concerns.push(`Handover quality is critically low at ${handoverQualityRate}% — information is being lost between night and day shifts, creating continuity of care risks.`);
  }

  if (quietNightRate < 20) {
    concerns.push(`Only ${quietNightRate}% of nights are undisturbed — the majority of nights involve some level of disruption, which may impact children's sleep, emotional regulation, and daytime functioning.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  if (buildingSecureCount < totalLogs) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement a mandatory building security checklist for every night shift. Building must be confirmed secure before the night log is completed. Review physical security procedures with all night staff immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (checkComplianceRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review overnight welfare check procedures. Ensure waking night staff complete all 5 scheduled checks and sleep-in staff complete at least 2 checks per shift. Consider implementing timed reminders.",
      urgency: "immediate",
      regulatory_ref: "NMS 7.9",
    });
  }

  if (significantDisturbanceCount > 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct a multi-disciplinary review of persistent significant disturbances. Analyse patterns (times, children involved, triggers) and update individual care plans with targeted night-time strategies. Consider CAMHS or therapeutic input.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6",
    });
  }

  if (logsWithDisturbances.length > 0 && disturbanceResponseRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure every disturbance has a recorded response action. Staff should document what happened, what they did, and the outcome. This is essential evidence for Ofsted and for understanding children's overnight needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (alarmComplianceRate < 90) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review alarm-setting procedures with all night staff. Alarms must be set on every night shift — include alarm confirmation as a required field in the night log completion process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (handoverQualityRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve handover documentation between night and day shifts. Both handover notes and morning handover summaries should be completed on every shift to ensure continuity of care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6",
    });
  }

  if (quietNightRate < 50 && totalDisturbanceCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review bedtime routines, sleep hygiene practices, and the overnight environment (noise, temperature, lighting). Over half of nights are experiencing disturbances — a structured sleep improvement plan is needed.",
      urgency: "planned",
      regulatory_ref: "NMS 7.9",
    });
  }

  if ((averageDisturbanceDuration ?? 0) > 30 && totalDisturbanceCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Average disturbance duration is ${averageDisturbanceDuration} minutes. Review de-escalation and settling strategies with night staff to reduce disturbance duration and support children back to sleep more effectively.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  // Critical insights
  if (significantDisturbanceCount > 2) {
    insights.push({
      text: `${significantDisturbanceCount} significant disturbance events recorded. Persistent significant overnight disruption affects children's emotional regulation, education attendance, and overall wellbeing. Ofsted will examine whether the home is responding therapeutically to these patterns.`,
      severity: "critical",
    });
  }

  if (checkComplianceRate < 50) {
    insights.push({
      text: `Welfare check compliance is critically low at ${checkComplianceRate}%. Overnight welfare checks are a fundamental safeguarding requirement under NMS 7.9 — without consistent checks, there is no evidence that children are being monitored and kept safe during sleeping hours.`,
      severity: "critical",
    });
  }

  if (buildingSecurityRate < 90) {
    insights.push({
      text: `Building security rate is ${buildingSecurityRate}%. Failure to secure the premises overnight creates a direct physical safety risk for children. This will be scrutinised at inspection under Reg 12.`,
      severity: "critical",
    });
  }

  // Warning insights
  if (significantDisturbanceCount >= 1 && significantDisturbanceCount <= 2) {
    insights.push({
      text: `${significantDisturbanceCount} significant disturbance event${significantDisturbanceCount > 1 ? "s" : ""} recorded. While not yet a pattern, monitor closely and review whether individual care plans adequately address overnight needs.`,
      severity: "warning",
    });
  }

  if (handoverQualityRate >= 40 && handoverQualityRate < 70) {
    insights.push({
      text: `Handover quality at ${handoverQualityRate}% is below expectations. Incomplete handovers mean day staff may miss important information about children's overnight experiences, affecting the quality of morning care.`,
      severity: "warning",
    });
  }

  if ((averageDisturbanceDuration ?? 0) > 30 && totalDisturbanceCount > 0) {
    insights.push({
      text: `Average disturbance duration of ${averageDisturbanceDuration} minutes suggests children are taking a long time to settle after disruption. Review night staff de-escalation skills and consider whether environmental adjustments could help.`,
      severity: "warning",
    });
  }

  // Positive insights
  if (checkComplianceRate >= 95 && buildingSecurityRate >= 98 && alarmComplianceRate >= 98) {
    insights.push({
      text: `Excellent overnight governance: ${checkComplianceRate}% check compliance, ${buildingSecurityRate}% building security, ${alarmComplianceRate}% alarm compliance. This demonstrates a home with robust night-time safeguarding procedures — strong evidence for Reg 12 and NMS 7.9 compliance.`,
      severity: "positive",
    });
  }

  if (quietNightRate >= 70 && significantDisturbanceCount === 0) {
    insights.push({
      text: `${quietNightRate}% of nights are undisturbed with zero significant events. Children are sleeping well, which supports emotional regulation, education engagement, and overall placement stability.`,
      severity: "positive",
    });
  }

  if (logsWithDisturbances.length > 0 && disturbanceResponseRate >= 95 && handoverQualityRate >= 90) {
    insights.push({
      text: `All disturbances are being responded to (${disturbanceResponseRate}%) and handover quality is strong (${handoverQualityRate}%). Night staff are providing reflective, child-centred care with effective communication to day colleagues.`,
      severity: "positive",
    });
  }

  if (sleep_rating === "outstanding") {
    insights.push({
      text: "Night care practice is outstanding. Consistent welfare checks, secure premises, responsive disturbance management, and thorough handovers demonstrate that children are safe, settled, and well cared for overnight.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (sleep_rating === "outstanding") {
    headline = `Outstanding night care: ${quietNightRate}% quiet nights, ${checkComplianceRate}% check compliance, and all security measures consistently in place.`;
  } else if (sleep_rating === "good") {
    headline = `Good overnight care with ${checkComplianceRate}% check compliance and ${quietNightRate}% undisturbed nights — minor areas for improvement identified.`;
  } else if (sleep_rating === "adequate") {
    headline = `Night care is adequate but ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified — check compliance, security, or disturbance patterns need attention.`;
  } else {
    headline = `Night care requires urgent attention — ${significantDisturbanceCount} significant disturbances, ${checkComplianceRate}% check compliance, and ${buildingSecurityRate}% building security.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sleep_rating,
    sleep_score: score,
    headline,
    total_logs: totalLogs,
    waking_night_count: wakingNightCount,
    sleep_in_count: sleepInCount,
    check_compliance_rate: checkComplianceRate,
    building_security_rate: buildingSecurityRate,
    alarm_compliance_rate: alarmComplianceRate,
    disturbance_response_rate: disturbanceResponseRate,
    quiet_night_rate: quietNightRate,
    significant_disturbance_count: significantDisturbanceCount,
    handover_quality_rate: handoverQualityRate,
    average_disturbance_duration: averageDisturbanceDuration,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
