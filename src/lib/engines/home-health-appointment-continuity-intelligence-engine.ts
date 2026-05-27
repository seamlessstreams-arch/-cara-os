// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH APPOINTMENT CONTINUITY INTELLIGENCE ENGINE
// Pure deterministic engine: appointment attendance, health domain coverage,
// outcome documentation, transport arrangements, and follow-up completion.
// CHR 2015 Reg 10: "The health and well-being standard." SCCIF: Health.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AppointmentRecordInput {
  id: string;
  child_id: string;
  appointment_type: string; // "gp"|"dental"|"optician"|"camhs"|"hospital"|"lac_review"|"pep_meeting"|"social_worker"|"court"|"therapy"|"specialist"|"immunisation"|"other"
  status: string; // "scheduled"|"attended"|"cancelled"|"missed"|"rescheduled"
  has_outcome: boolean;
  transport_arranged: boolean;
  has_escort: boolean;
  has_follow_up: boolean;
}

export interface HealthAppointmentInput {
  today: string;
  total_children: number;
  appointments: AppointmentRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HealthAppointmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HealthAppointmentResult {
  appointment_rating: HealthAppointmentRating;
  appointment_score: number;
  headline: string;
  total_appointments: number;
  attendance_rate: number;
  missed_rate: number;
  outcome_documentation_rate: number;
  transport_compliance_rate: number;
  health_domain_variety: number;
  children_with_appointments_rate: number;
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HealthAppointmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHealthAppointmentContinuity(
  input: HealthAppointmentInput,
): HealthAppointmentResult {
  const { appointments, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      appointment_rating: "insufficient_data",
      appointment_score: 0,
      headline: "No data available for health appointment analysis",
      total_appointments: 0,
      attendance_rate: 0,
      missed_rate: 0,
      outcome_documentation_rate: 0,
      transport_compliance_rate: 0,
      health_domain_variety: 0,
      children_with_appointments_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = appointments.length;

  const attended = appointments.filter(a => a.status === "attended").length;
  const attendanceRate = pct(attended, total);

  const missed = appointments.filter(a => a.status === "missed").length;
  const missedRate = pct(missed, total);

  const withOutcome = appointments.filter(a => a.has_outcome).length;
  const outcomeRate = pct(withOutcome, total);

  const withTransport = appointments.filter(a => a.transport_arranged).length;
  const transportRate = pct(withTransport, total);

  const uniqueTypes = new Set(appointments.map(a => a.appointment_type)).size;

  const uniqueChildren = new Set(appointments.map(a => a.child_id)).size;
  const childrenRate = pct(uniqueChildren, total_children);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Attendance rate
  if (total === 0) {
    score -= 3;
  } else {
    if (attendanceRate >= 90) score += 6;
    else if (attendanceRate >= 75) score += 2;
    else if (attendanceRate < 60) score -= 5;
  }

  // Modifier 2: Missed appointment rate (lower is better)
  if (total === 0) {
    // no adjustment
  } else {
    if (missedRate === 0) score += 5;
    else if (missedRate <= 5) score += 2;
    else if (missedRate >= 20) score -= 5;
  }

  // Modifier 3: Outcome documentation
  if (total === 0) {
    score -= 1;
  } else {
    if (outcomeRate >= 85) score += 5;
    else if (outcomeRate >= 60) score += 2;
    else if (outcomeRate < 40) score -= 4;
  }

  // Modifier 4: Transport compliance
  if (total === 0) {
    // no adjustment
  } else {
    if (transportRate >= 90) score += 4;
    else if (transportRate >= 70) score += 1;
    else if (transportRate < 50) score -= 4;
  }

  // Modifier 5: Health domain variety (breadth of health engagement)
  if (total === 0) {
    score -= 1;
  } else {
    if (uniqueTypes >= 5) score += 5;
    else if (uniqueTypes >= 3) score += 2;
    else if (uniqueTypes <= 1) score -= 3;
  }

  // Modifier 6: Children coverage
  if (total === 0) {
    score -= 2;
  } else {
    if (childrenRate >= 90) score += 5;
    else if (childrenRate >= 60) score += 2;
    else if (childrenRate < 40) score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Health appointment management is exemplary — children receive timely, comprehensive healthcare";
      break;
    case "good":
      headline = "Good health appointment practice with reliable attendance and broad health coverage";
      break;
    case "adequate":
      headline = "Health appointments are managed adequately but attendance and documentation need improvement";
      break;
    case "inadequate":
      headline = "Health appointment practice is inadequate — children are missing essential healthcare";
      break;
    default:
      headline = "No data available for health appointment analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (attendanceRate >= 90 && total > 0) strengths.push("Excellent appointment attendance ensures children receive consistent healthcare");
  if (missedRate === 0 && total > 0) strengths.push("No missed appointments — every health engagement is prioritised");
  if (outcomeRate >= 85 && total > 0) strengths.push("Appointment outcomes are consistently documented — care continuity is assured");
  if (transportRate >= 90 && total > 0) strengths.push("Transport is reliably arranged for all appointments");
  if (uniqueTypes >= 5 && total > 0) strengths.push("Broad range of health services engaged — children receive holistic healthcare");
  if (childrenRate >= 90 && total > 0) strengths.push("All children have scheduled health appointments — no child is overlooked");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No health appointments recorded — children may not be accessing essential healthcare");
  if (missedRate >= 20 && total > 0) concerns.push(`${missedRate}% of appointments are missed — children are not receiving planned healthcare`);
  if (attendanceRate < 60 && total > 0) concerns.push("Appointment attendance is critically low — health needs are going unmet");
  if (outcomeRate < 40 && total > 0) concerns.push("Most appointments lack outcome documentation — care continuity is compromised");
  if (childrenRate < 40 && total > 0) concerns.push("Most children have no recorded appointments — health oversight is inadequate");
  if (uniqueTypes <= 1 && total > 0) concerns.push("Health engagement is limited to a single domain — broader health needs may be unmet");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: HealthAppointmentResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Establish a comprehensive health appointment tracking system for all children", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (missedRate >= 10 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Investigate and address reasons for missed appointments to improve attendance", urgency: "immediate", regulatory_ref: "SCCIF Health" });
  }
  if (outcomeRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure outcomes are recorded for every attended appointment", urgency: "soon", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (childrenRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review health needs of children without appointments and schedule accordingly", urgency: "immediate", regulatory_ref: "SCCIF Health" });
  }
  if (uniqueTypes < 3 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Broaden health engagement to include dental, optician, and specialist services", urgency: "planned", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (transportRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure transport is arranged in advance for all health appointments", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: HealthAppointmentResult["insights"] = [];

  if (attendanceRate >= 90 && outcomeRate >= 85 && childrenRate >= 90 && total >= 10) {
    insights.push({ text: "Health appointment management is exemplary — every child receives timely, well-documented healthcare", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No health appointments on record means Ofsted cannot verify children are accessing healthcare", severity: "critical" });
  }
  if (missedRate >= 20 && total > 0) {
    insights.push({ text: "High missed appointment rate suggests barriers to healthcare access — investigate transport, consent and motivation", severity: "warning" });
  }
  if (childrenRate >= 90 && total > 0) {
    insights.push({ text: "All children have health appointments — the home ensures no child falls through the net", severity: "positive" });
  }
  if (uniqueTypes >= 5 && total > 0) {
    insights.push({ text: "Holistic health engagement across multiple domains shows the home takes a whole-child approach to wellbeing", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    appointment_rating: rating,
    appointment_score: score,
    headline,
    total_appointments: total,
    attendance_rate: attendanceRate,
    missed_rate: missedRate,
    outcome_documentation_rate: outcomeRate,
    transport_compliance_rate: transportRate,
    health_domain_variety: uniqueTypes,
    children_with_appointments_rate: childrenRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
