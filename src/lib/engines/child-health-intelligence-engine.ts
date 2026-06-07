// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD HEALTH & WELLBEING INTELLIGENCE ENGINE
//
// Per-child health analysis: medication compliance, health assessment status,
// dental/optician/immunisation compliance, CAMHS engagement, mental health
// check-ins, appointment attendance, and wellbeing trajectory.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 23 (health of children), Reg 7 (welfare).
// SCCIF: "Health and well-being" — "Are children's physical and mental
// health needs being met?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MedicationInput {
  id: string;
  name: string;
  type: string;          // regular, prn, controlled, otc
  dosage: string;
  frequency: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface MedicationAdminInput {
  id: string;
  medication_id: string;
  date: string;
  status: string;        // given, late, refused, missed, scheduled
  witnessed: boolean;
}

export interface HealthAssessmentInput {
  id: string;
  type: string;          // initial, annual, review
  date: string;
  status: string;        // completed, scheduled, overdue
  outcome: string;
}

export interface DentalRecordInput {
  id: string;
  date: string;
  type: string;          // check_up, treatment, emergency
  outcome: string;
  next_due: string | null;
}

export interface OpticiansRecordInput {
  id: string;
  date: string;
  outcome: string;
  next_due: string | null;
}

export interface ImmunisationInput {
  id: string;
  vaccine: string;
  date: string;
  status: string;        // completed, due, overdue, declined
}

export interface CamhsInput {
  id: string;
  referral_date: string;
  status: string;        // active, waiting, discharged, declined
  sessions_attended: number;
  sessions_offered: number;
  engagement_level: string;  // good, moderate, poor, disengaged
  next_appointment: string | null;
}

export interface MentalHealthCheckInInput {
  id: string;
  date: string;
  overall_mood: number;     // 1-5
  anxiety_level: number;    // 1-5
  sleep_quality: number;    // 1-5
  concerns: string[];
}

export interface AppointmentInput {
  id: string;
  date: string;
  type: string;             // gp, dental, optician, camhs, hospital, specialist
  attended: boolean;
  rescheduled: boolean;
}

export interface ChildHealthIntelligenceInput {
  today: string;
  child_id: string;
  child_name: string;
  medications: MedicationInput[];
  medication_administrations: MedicationAdminInput[];
  health_assessments: HealthAssessmentInput[];
  dental_records: DentalRecordInput[];
  opticians_records: OpticiansRecordInput[];
  immunisations: ImmunisationInput[];
  camhs: CamhsInput | null;
  mental_health_check_ins: MentalHealthCheckInInput[];
  appointments: AppointmentInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HealthStatus = "excellent" | "good" | "monitoring" | "concern" | "critical";

export interface MedicationCompliance {
  active_medications: number;
  total_administrations_30d: number;
  given_rate: number;          // 0-100
  refused_count_30d: number;
  missed_count_30d: number;
  late_count_30d: number;
  witnessed_rate: number;      // 0-100
  prn_count_30d: number;
  medications_summary: { name: string; type: string; compliance_rate: number }[];
}

export interface HealthComplianceStatus {
  health_assessment_current: boolean;
  health_assessment_last_date: string | null;
  dental_current: boolean;
  dental_last_date: string | null;
  dental_next_due: string | null;
  optician_current: boolean;
  optician_last_date: string | null;
  optician_next_due: string | null;
  immunisations_up_to_date: boolean;
  immunisations_overdue: number;
  immunisations_declined: number;
}

export interface CamhsStatus {
  engaged: boolean;
  status: string | null;
  attendance_rate: number;     // 0-100
  engagement_level: string | null;
  waiting: boolean;
  next_appointment: string | null;
}

export interface WellbeingTrajectory {
  data_points: number;
  avg_mood: number;            // 1-5
  avg_anxiety: number;         // 1-5
  avg_sleep: number;           // 1-5
  mood_trend: "improving" | "stable" | "declining" | "insufficient_data";
  recent_concerns: string[];
}

export interface AppointmentAnalysis {
  total_90d: number;
  attended_rate: number;       // 0-100
  dna_count: number;
  rescheduled_count: number;
}

export type RecommendationUrgency = "immediate" | "soon" | "planned";

export interface HealthRecommendation {
  rank: number;
  recommendation: string;
  urgency: RecommendationUrgency;
  domain: string;
  regulatory_ref: string;
}

export interface HealthInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildHealthIntelligenceResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  health_status: HealthStatus;
  health_score: number;        // 0-100
  headline: string;
  medication_compliance: MedicationCompliance;
  health_compliance: HealthComplianceStatus;
  camhs_status: CamhsStatus;
  wellbeing_trajectory: WellbeingTrajectory;
  appointment_analysis: AppointmentAnalysis;
  strengths: string[];
  concerns: string[];
  recommendations: HealthRecommendation[];
  insights: HealthInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  const da = daysAgo(today, date);
  return da >= 0 && da <= days;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildHealthIntelligence(
  input: ChildHealthIntelligenceInput,
): ChildHealthIntelligenceResult {
  const { today, child_id, child_name, medications, medication_administrations, health_assessments, dental_records, opticians_records, immunisations, camhs, mental_health_check_ins, appointments } = input;

  // ── Medication Compliance ─────────────────────────────────────────────
  const activeMeds = medications.filter((m) => m.is_active);
  const admins30d = medication_administrations.filter((a) => isWithin(today, a.date, 30) && a.status !== "scheduled");
  const givenAdmins = admins30d.filter((a) => a.status === "given" || a.status === "late");
  const refusedCount = admins30d.filter((a) => a.status === "refused").length;
  const missedCount = admins30d.filter((a) => a.status === "missed").length;
  const lateCount = admins30d.filter((a) => a.status === "late").length;
  const witnessedCount = admins30d.filter((a) => a.witnessed).length;
  const prnMeds = activeMeds.filter((m) => m.type === "prn");
  const prnAdmins = admins30d.filter((a) => prnMeds.some((m) => m.id === a.medication_id));

  // Per-medication compliance
  const medsSummary = activeMeds.map((med) => {
    const medAdmins = admins30d.filter((a) => a.medication_id === med.id);
    const medGiven = medAdmins.filter((a) => a.status === "given" || a.status === "late").length;
    return {
      name: med.name,
      type: med.type,
      compliance_rate: pct(medGiven, medAdmins.length),
    };
  });

  const medication_compliance: MedicationCompliance = {
    active_medications: activeMeds.length,
    total_administrations_30d: admins30d.length,
    given_rate: pct(givenAdmins.length, admins30d.length),
    refused_count_30d: refusedCount,
    missed_count_30d: missedCount,
    late_count_30d: lateCount,
    witnessed_rate: pct(witnessedCount, admins30d.length),
    prn_count_30d: prnAdmins.length,
    medications_summary: medsSummary,
  };

  // ── Health Compliance ─────────────────────────────────────────────────
  const completedAssessments = health_assessments
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastAssessmentDate = completedAssessments[0]?.date?.slice(0, 10) ?? null;
  const assessmentCurrent = lastAssessmentDate ? daysAgo(today, lastAssessmentDate) <= 365 : false;

  const sortedDental = [...dental_records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastDental = sortedDental[0];
  const dentalCurrent = lastDental ? daysAgo(today, lastDental.date) <= 365 : false;

  const sortedOptician = [...opticians_records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastOptician = sortedOptician[0];
  const opticianCurrent = lastOptician ? daysAgo(today, lastOptician.date) <= 730 : false; // 2 years

  const overdueImmunisations = immunisations.filter((i) => i.status === "overdue").length;
  const declinedImmunisations = immunisations.filter((i) => i.status === "declined").length;
  // Up to date ONLY when every record is completed. Previously this checked only
  // `overdue === 0`, so a child whose immunisations are "due" (needed now) or
  // "declined" was falsely reported up to date — false reassurance that a child
  // who is NOT protected appears protected. "due"/"declined" now surface for review.
  const immunisationsUpToDate = immunisations.length > 0 && immunisations.every((i) => i.status === "completed");

  const health_compliance: HealthComplianceStatus = {
    health_assessment_current: assessmentCurrent,
    health_assessment_last_date: lastAssessmentDate,
    dental_current: dentalCurrent,
    dental_last_date: lastDental?.date?.slice(0, 10) ?? null,
    dental_next_due: lastDental?.next_due?.slice(0, 10) ?? null,
    optician_current: opticianCurrent,
    optician_last_date: lastOptician?.date?.slice(0, 10) ?? null,
    optician_next_due: lastOptician?.next_due?.slice(0, 10) ?? null,
    immunisations_up_to_date: immunisationsUpToDate,
    immunisations_overdue: overdueImmunisations,
    immunisations_declined: declinedImmunisations,
  };

  // ── CAMHS Status ──────────────────────────────────────────────────────
  const camhsStatus: CamhsStatus = {
    engaged: camhs?.status === "active" || false,
    status: camhs?.status ?? null,
    attendance_rate: camhs ? pct(camhs.sessions_attended, camhs.sessions_offered) : 0,
    engagement_level: camhs?.engagement_level ?? null,
    waiting: camhs?.status === "waiting",
    next_appointment: camhs?.next_appointment?.slice(0, 10) ?? null,
  };

  // ── Wellbeing Trajectory ──────────────────────────────────────────────
  const recent30d = mental_health_check_ins.filter((c) => isWithin(today, c.date, 30));
  const older30d = mental_health_check_ins.filter((c) => isWithin(today, c.date, 60) && !isWithin(today, c.date, 30));

  const moods = mental_health_check_ins.map((c) => c.overall_mood);
  const anxieties = mental_health_check_ins.map((c) => c.anxiety_level);
  const sleepQuals = mental_health_check_ins.map((c) => c.sleep_quality);

  const recentMoodAvg = avg(recent30d.map((c) => c.overall_mood));
  const olderMoodAvg = avg(older30d.map((c) => c.overall_mood));

  const moodTrend: "improving" | "stable" | "declining" | "insufficient_data" =
    mental_health_check_ins.length < 3 ? "insufficient_data" :
    recentMoodAvg > olderMoodAvg + 0.3 ? "improving" :
    recentMoodAvg < olderMoodAvg - 0.3 ? "declining" :
    "stable";

  const recentConcerns = [...new Set(recent30d.flatMap((c) => c.concerns))];

  const wellbeing_trajectory: WellbeingTrajectory = {
    data_points: mental_health_check_ins.length,
    avg_mood: avg(moods),
    avg_anxiety: avg(anxieties),
    avg_sleep: avg(sleepQuals),
    mood_trend: moodTrend,
    recent_concerns: recentConcerns.slice(0, 5),
  };

  // ── Appointment Analysis ──────────────────────────────────────────────
  const appt90d = appointments.filter((a) => isWithin(today, a.date, 90));
  const dnaCount = appt90d.filter((a) => !a.attended && !a.rescheduled).length;
  const rescheduledCount = appt90d.filter((a) => a.rescheduled).length;
  const attendedAppts = appt90d.filter((a) => a.attended);

  const appointment_analysis: AppointmentAnalysis = {
    total_90d: appt90d.length,
    attended_rate: pct(attendedAppts.length, appt90d.length),
    dna_count: dnaCount,
    rescheduled_count: rescheduledCount,
  };

  // ── Health Score (0-100) ──────────────────────────────────────────────
  let score = 50;

  // Medication compliance. Only score when administrations were actually recorded
  // in the window — pct() returns 100 for 0/0, so an active med with zero logged
  // administrations would otherwise score as 100% compliant (false reassurance).
  if (activeMeds.length > 0 && medication_compliance.total_administrations_30d > 0) {
    if (medication_compliance.given_rate >= 95) score += 10;
    else if (medication_compliance.given_rate >= 80) score += 5;
    else if (medication_compliance.given_rate < 70) score -= 10;
    else score -= 5;

    if (refusedCount >= 3) score -= 5;
    if (missedCount >= 2) score -= 5;
    if (medication_compliance.witnessed_rate === 100) score += 3;
  }

  // Health compliance
  if (assessmentCurrent) score += 5;
  else score -= 8;

  if (dentalCurrent) score += 3;
  else score -= 5;

  if (opticianCurrent) score += 2;
  else score -= 3;

  if (immunisationsUpToDate && immunisations.length > 0) score += 3;
  if (overdueImmunisations > 0) score -= overdueImmunisations * 3;

  // CAMHS
  if (camhs) {
    if (camhsStatus.engaged && camhsStatus.attendance_rate >= 80) score += 5;
    else if (camhsStatus.engaged && camhsStatus.attendance_rate < 50) score -= 3;
    if (camhsStatus.waiting) score -= 3;
  }

  // Wellbeing
  if (moodTrend === "improving") score += 5;
  else if (moodTrend === "declining") score -= 5;

  if (wellbeing_trajectory.avg_mood >= 4) score += 3;
  else if (wellbeing_trajectory.avg_mood > 0 && wellbeing_trajectory.avg_mood < 2.5) score -= 5;

  if (wellbeing_trajectory.avg_anxiety > 0 && wellbeing_trajectory.avg_anxiety > 3.5) score -= 3;
  if (wellbeing_trajectory.avg_sleep >= 4) score += 2;
  else if (wellbeing_trajectory.avg_sleep > 0 && wellbeing_trajectory.avg_sleep < 2.5) score -= 3;

  // Appointments
  if (appt90d.length > 0) {
    if (appointment_analysis.attended_rate === 100) score += 3;
    if (dnaCount >= 2) score -= 5;
  }

  score = clamp(Math.round(score), 0, 100);

  const health_status: HealthStatus =
    score >= 80 ? "excellent" :
    score >= 65 ? "good" :
    score >= 50 ? "monitoring" :
    score >= 35 ? "concern" :
    "critical";

  // ── Headline ──────────────────────────────────────────────────────────
  const headlineParts: string[] = [];
  headlineParts.push(`${child_name}'s health status is ${health_status}`);
  if (activeMeds.length > 0) {
    const complianceNote = medication_compliance.total_administrations_30d > 0
      ? ` (${medication_compliance.given_rate}% compliance)`
      : "";
    headlineParts.push(`${activeMeds.length} active medication${activeMeds.length !== 1 ? "s" : ""}${complianceNote}`);
  }
  if (!assessmentCurrent) headlineParts.push("health assessment overdue");
  if (camhsStatus.waiting) headlineParts.push("CAMHS waiting list");
  const headline = headlineParts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (activeMeds.length > 0 && medication_compliance.total_administrations_30d > 0 && medication_compliance.given_rate >= 95) {
    strengths.push(`Medication compliance at ${medication_compliance.given_rate}% — consistent administration supporting ${child_name}'s health needs.`);
  }

  if (activeMeds.length > 0 && medication_compliance.total_administrations_30d > 0 && medication_compliance.witnessed_rate === 100) {
    strengths.push("All medication administrations witnessed — meeting dual-signature best practice.");
  }

  if (assessmentCurrent) {
    strengths.push("Health assessment is current — statutory requirement met.");
  }

  if (dentalCurrent && opticianCurrent) {
    strengths.push("Dental and optician checks are up to date — comprehensive health monitoring in place.");
  }

  if (immunisationsUpToDate && immunisations.length > 0) {
    strengths.push("Immunisations up to date — proactive health protection.");
  }

  if (camhsStatus.engaged && camhsStatus.attendance_rate >= 80) {
    strengths.push(`CAMHS engagement is strong (${camhsStatus.attendance_rate}% attendance) — therapeutic support is being accessed.`);
  }

  if (moodTrend === "improving") {
    strengths.push(`${child_name}'s mood trajectory is improving — positive wellbeing trend.`);
  }

  if (appt90d.length >= 3 && appointment_analysis.attended_rate === 100) {
    strengths.push(`All ${appt90d.length} health appointments attended — proactive health management.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (activeMeds.length > 0 && medication_compliance.given_rate < 80) {
    concerns.push(`Medication compliance at ${medication_compliance.given_rate}% — below 80% threshold. Review barriers to administration and consider medication review (Reg 23).`);
  }

  if (refusedCount >= 3) {
    concerns.push(`${refusedCount} medication refusals in 30 days — explore reasons with child and prescriber. Document refusal conversations.`);
  }

  if (missedCount >= 2) {
    concerns.push(`${missedCount} missed medication administrations in 30 days — investigate staffing or scheduling issues. Each missed dose must be documented and reported.`);
  }

  if (!assessmentCurrent) {
    concerns.push(`Health assessment is not current (last: ${lastAssessmentDate ?? "none"}) — every LAC child must have an annual health assessment (Reg 23).`);
  }

  if (!dentalCurrent) {
    concerns.push(`Dental check not current (last: ${health_compliance.dental_last_date ?? "none"}) — children should have dental checks every 6-12 months.`);
  }

  if (!opticianCurrent) {
    concerns.push(`Optician check not current (last: ${health_compliance.optician_last_date ?? "none"}) — arrange routine eye test.`);
  }

  if (overdueImmunisations > 0) {
    concerns.push(`${overdueImmunisations} overdue immunisation(s) — contact GP to schedule catch-up programme.`);
  }

  if (camhsStatus.waiting) {
    concerns.push("Child is on CAMHS waiting list — monitor wellbeing and arrange interim therapeutic support if possible.");
  }

  if (camhsStatus.engaged && camhsStatus.attendance_rate < 50) {
    concerns.push(`CAMHS attendance rate at ${camhsStatus.attendance_rate}% — low engagement risks losing the referral. Explore barriers with child.`);
  }

  if (moodTrend === "declining") {
    concerns.push(`${child_name}'s mood is declining — consider additional support, therapeutic review, or mental health referral.`);
  }

  if (wellbeing_trajectory.avg_anxiety > 3.5 && mental_health_check_ins.length >= 3) {
    concerns.push(`Persistent high anxiety levels (avg ${wellbeing_trajectory.avg_anxiety}/5) — consider anxiety-specific intervention or CAMHS referral.`);
  }

  if (dnaCount >= 2) {
    concerns.push(`${dnaCount} missed health appointments (DNA) in 90 days — health appointments must be facilitated and supported (Reg 23).`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: HealthRecommendation[] = [];
  let rank = 0;

  if (!assessmentCurrent) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Schedule statutory health assessment with LAC health team. Annual health assessments are mandatory for all looked after children.",
      urgency: "immediate",
      domain: "assessment",
      regulatory_ref: "Reg 23",
    });
  }

  if (activeMeds.length > 0 && medication_compliance.given_rate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Convene medication review meeting with prescriber, key worker, and child. Explore barriers to compliance and consider alternative formulations or timing.",
      urgency: "immediate",
      domain: "medication",
      regulatory_ref: "Reg 23",
    });
  }

  if (refusedCount >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Address ${refusedCount} medication refusals — hold discussion with child about concerns, consult prescriber about alternatives, and document all conversations.`,
      urgency: "soon",
      domain: "medication",
      regulatory_ref: "Reg 23",
    });
  }

  if (overdueImmunisations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Contact GP to arrange immunisation catch-up. LAC children should have complete vaccination histories — gaps may indicate previous neglect.",
      urgency: "soon",
      domain: "immunisation",
      regulatory_ref: "Reg 23",
    });
  }

  if (!dentalCurrent) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Book dental check-up. Many LAC children arrive with unaddressed dental needs — early identification prevents escalation.",
      urgency: "soon",
      domain: "dental",
      regulatory_ref: "Reg 23",
    });
  }

  if (camhsStatus.waiting) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Contact CAMHS to confirm waiting list position. Arrange interim therapeutic support (e.g., creative therapy, play therapy, or counselling) to bridge the gap.",
      urgency: "soon",
      domain: "camhs",
      regulatory_ref: "Reg 23",
    });
  }

  if (moodTrend === "declining") {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review ${child_name}'s wellbeing trajectory with key worker. Consider whether additional professional input (CAMHS, counselling, or GP review) is needed.`,
      urgency: "soon",
      domain: "wellbeing",
      regulatory_ref: "Reg 7",
    });
  }

  if (dnaCount >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate reasons for missed appointments. Arrange transport support if needed and consider whether appointment timing suits the child's routine.",
      urgency: "planned",
      domain: "appointments",
      regulatory_ref: "Reg 23",
    });
  }

  if (!opticianCurrent) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Book routine eye test. Update health plan with results.",
      urgency: "planned",
      domain: "optician",
      regulatory_ref: "Reg 23",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: HealthInsight[] = [];

  if (health_status === "critical") {
    insights.push({
      severity: "critical",
      text: `${child_name}'s health status is critical. Multiple health compliance gaps, medication concerns, or deteriorating wellbeing indicators require immediate action. Ofsted expects robust health promotion for all LAC children — inspectors will examine whether the home is meeting statutory health obligations (Reg 23).`,
    });
  }

  if (activeMeds.length > 0 && medication_compliance.given_rate < 70) {
    insights.push({
      severity: "critical",
      text: `Medication compliance below 70% represents a significant safeguarding concern. Poor compliance can directly impact ${child_name}'s physical or mental health. An immediate medication review with the prescriber is essential — document all actions taken.`,
    });
  }

  if (!assessmentCurrent && camhsStatus.waiting) {
    insights.push({
      severity: "warning",
      text: `Health assessment overdue while on CAMHS waiting list creates a dual health gap. ${child_name}'s physical and mental health needs may be going unmonitored. Fast-track the health assessment and arrange interim therapeutic support.`,
    });
  }

  if (moodTrend === "declining" && wellbeing_trajectory.avg_anxiety > 3) {
    insights.push({
      severity: "warning",
      text: `Declining mood combined with elevated anxiety levels indicates ${child_name} may be struggling. Review recent events (placement changes, contact issues, school difficulties) that might be driving this pattern. Consider referral for targeted anxiety intervention.`,
    });
  }

  if (health_status === "excellent" || health_status === "good") {
    insights.push({
      severity: "positive",
      text: `${child_name}'s health status is ${health_status}. The home is effectively promoting health and wellbeing — medication compliance, health checks, and professional engagement are meeting or exceeding expectations.`,
    });
  }

  if (assessmentCurrent && dentalCurrent && opticianCurrent && (immunisationsUpToDate || immunisations.length === 0)) {
    insights.push({
      severity: "positive",
      text: `All statutory health checks are current for ${child_name}. This comprehensive health monitoring evidences proactive care and strong Reg 23 compliance — exactly what inspectors look for.`,
    });
  }

  if (activeMeds.length > 0 && medication_compliance.given_rate >= 95 && medication_compliance.witnessed_rate === 100) {
    insights.push({
      severity: "positive",
      text: `Outstanding medication management — ${medication_compliance.given_rate}% compliance with 100% witnessed administration. This level of pharmaceutical care demonstrates rigorous health practice.`,
    });
  }

  if (camhsStatus.engaged && camhsStatus.attendance_rate >= 80) {
    insights.push({
      severity: "positive",
      text: `Strong CAMHS engagement with ${camhsStatus.attendance_rate}% attendance. Consistent therapeutic access is a key protective factor for ${child_name}'s mental health and emotional development.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    health_status,
    health_score: score,
    headline,
    medication_compliance,
    health_compliance,
    camhs_status: camhsStatus,
    wellbeing_trajectory,
    appointment_analysis,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
