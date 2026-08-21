// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CAMHS & SPECIALIST REFERRAL INTELLIGENCE ENGINE
// Tracks CAMHS referrals, specialist service access, waiting times, appointment
// attendance, and therapeutic pathway quality for looked-after children.
// Pure deterministic engine. CHR 2015 Reg 10/33/34.
// ══════════════════════════════════════════════════════════════════════════════

export interface CamhsReferralInput {
  id: string;
  child_id: string;
  referral_date: string;
  status: string;              // "open" | "accepted" | "waiting" | "active" | "discharged" | "rejected"
  waiting_days: number;
  appointments_offered: number;
  appointments_attended: number;
  outcome_recorded: boolean;
}

export interface EmergencyReferralInput {
  id: string;
  child_id: string;
  date: string;
  type: string;                // "crisis" | "self_harm" | "overdose" | "psychotic_episode"
  response_within_24h: boolean;
  follow_up_completed: boolean;
}

export interface SpecialistContactInput {
  id: string;
  child_id: string;
  service: string;             // "camhs" | "speech_therapy" | "occupational_therapy" | "physiotherapy" | "paediatrician" | etc
  date: string;
  attended: boolean;
  outcome_recorded: boolean;
}

export interface CamhsSpecialistInput {
  today: string;
  total_children: number;
  camhs_referrals: CamhsReferralInput[];
  emergency_referrals: EmergencyReferralInput[];
  specialist_contacts: SpecialistContactInput[];
}

export type CamhsSpecialistRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface CamhsSpecialistResult {
  camhs_rating: CamhsSpecialistRating;
  camhs_score: number | null;
  headline: string;
  active_referrals: number;
  children_waiting: number;
  average_wait_days: number | null;
  appointment_attendance_rate: number | null;
  emergency_response_rate: number | null;
  specialist_coverage_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }

export function computeCamhsSpecialistReferral(input: CamhsSpecialistInput): CamhsSpecialistResult {
  const { total_children, camhs_referrals, emergency_referrals, specialist_contacts } = input;

  if (total_children === 0) {
    return {
      camhs_rating: "insufficient_data", camhs_score: 0,
      headline: "No children in placement — CAMHS & specialist referral pathways cannot be assessed.",
      active_referrals: 0, children_waiting: 0, average_wait_days: 0,
      appointment_attendance_rate: 0, emergency_response_rate: 0, specialist_coverage_rate: 0,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── CAMHS referrals ─────────────────────────────────────────────────────
  const active = camhs_referrals.filter(r => r.status === "active" || r.status === "accepted" || r.status === "open");
  const waiting = camhs_referrals.filter(r => r.status === "waiting");
  const rejected = camhs_referrals.filter(r => r.status === "rejected");
  const allAppts = camhs_referrals.reduce((s, r) => s + r.appointments_offered, 0);
  const allAttended = camhs_referrals.reduce((s, r) => s + r.appointments_attended, 0);
  const attendRate = pct(allAttended, allAppts);
  const avgWait = waiting.length > 0 ? Math.round(waiting.reduce((s, r) => s + r.waiting_days, 0) / waiting.length) : null;
  const outcomeRecorded = camhs_referrals.filter(r => r.outcome_recorded).length;

  // ── Emergency referrals ─────────────────────────────────────────────────
  const emergResponse = emergency_referrals.filter(e => e.response_within_24h).length;
  const emergResponseRate = pct(emergResponse, emergency_referrals.length);
  const emergFollowUp = emergency_referrals.filter(e => e.follow_up_completed).length;
  const emergFollowUpRate = pct(emergFollowUp, emergency_referrals.length);

  // ── Specialist contacts ─────────────────────────────────────────────────
  const childrenWithSpecialist = new Set(specialist_contacts.map(c => c.child_id)).size;
  const specialistCoverageRate = pct(childrenWithSpecialist, total_children);
  const specAttended = specialist_contacts.filter(c => c.attended).length;
  const specAttendRate = pct(specAttended, specialist_contacts.length);
  const specOutcome = specialist_contacts.filter(c => c.outcome_recorded).length;

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 52; // base

  // Mod 1: CAMHS referral pathway (±7)
  if (camhs_referrals.length === 0) {
    score += 2; // neutral — no referrals needed
  } else {
    if (rejected.length === 0 && attendRate >= 90) score += 7;
    else if (attendRate >= 75) score += 4;
    else if (attendRate >= 50) score += 0;
    else score -= 7;
  }

  // Mod 2: Waiting times (±5)
  if (waiting.length === 0) score += 5;
  else if ((avgWait ?? 0) <= 28) score += 3;
  else if ((avgWait ?? 0) <= 56) score += 0;
  else if ((avgWait ?? 0) <= 90) score -= 2;
  else score -= 5;

  // Mod 3: Emergency response (±6)
  if (emergency_referrals.length === 0) score += 3; // neutral
  else if (emergResponseRate >= 100 && emergFollowUpRate >= 90) score += 6;
  else if (emergResponseRate >= 80) score += 3;
  else if (emergResponseRate >= 60) score += 0;
  else score -= 6;

  // Mod 4: Specialist access (±5)
  if (specialist_contacts.length === 0) score += 0; // neutral
  else if (specialistCoverageRate >= 80 && specAttendRate >= 85) score += 5;
  else if (specialistCoverageRate >= 60 && specAttendRate >= 70) score += 2;
  else if (specialistCoverageRate >= 40) score += 0;
  else score -= 5;

  // Mod 5: Outcome recording (±4)
  if (camhs_referrals.length === 0 && specialist_contacts.length === 0) score += 2; // neutral
  else {
    const combinedOutcome = pct(outcomeRecorded + specOutcome, camhs_referrals.length + specialist_contacts.length);
    if (combinedOutcome >= 90) score += 4;
    else if (combinedOutcome >= 70) score += 2;
    else if (combinedOutcome >= 50) score += 0;
    else score -= 4;
  }

  // Mod 6: Rejections (-3 to +1)
  if (rejected.length === 0) score += 1;
  else if (rejected.length <= 1) score -= 1;
  else score -= 3;

  score = Math.max(0, Math.min(score, 100));

  const camhs_rating: CamhsSpecialistRating =
    score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (waiting.length === 0 && camhs_referrals.length > 0) strengths.push("No children waiting for CAMHS — all referrals have progressed to active treatment.");
  if (attendRate >= 90 && allAppts > 0) strengths.push(`${attendRate}% appointment attendance — children consistently engage with therapeutic services.`);
  if (emergency_referrals.length > 0 && emergResponseRate >= 100) strengths.push("100% of emergency mental health referrals responded to within 24 hours.");
  if (specialistCoverageRate >= 80 && specialist_contacts.length > 0) strengths.push("Over 80% of children accessing specialist services — comprehensive health pathway.");
  if (rejected.length === 0 && camhs_referrals.length > 0) strengths.push("No CAMHS referrals rejected — referral quality and threshold knowledge is strong.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (waiting.length >= 3) concerns.push(`${waiting.length} children waiting for CAMHS services — delay in accessing mental health support.`);
  else if (waiting.length >= 1) concerns.push(`${waiting.length} child(ren) waiting for CAMHS — monitor waiting times closely.`);
  if ((avgWait ?? 0) > 56) concerns.push(`Average CAMHS wait of ${(avgWait ?? 0)} days exceeds 8-week target — children's mental health needs not met promptly.`);
  if (emergency_referrals.length > 0 && emergResponseRate < 80) concerns.push(`Emergency mental health response at ${emergResponseRate}% — children in crisis must receive immediate support.`);
  if (rejected.length >= 2) concerns.push(`${rejected.length} CAMHS referrals rejected — consider referral quality or re-referral with additional evidence.`);
  if (allAppts > 0 && attendRate < 60) concerns.push(`CAMHS attendance at ${attendRate}% — low engagement may reflect barriers or reluctance.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (emergency_referrals.length > 0 && emergResponseRate < 100) recommendations.push({ rank: ++rank, recommendation: "Ensure 100% emergency mental health response within 24 hours — review crisis protocols.", urgency: "immediate", regulatory_ref: "Reg 34" });
  if ((avgWait ?? 0) > 56) recommendations.push({ rank: ++rank, recommendation: `Escalate CAMHS waiting list (avg ${(avgWait ?? 0)} days) — consider alternative therapeutic provision.`, urgency: "immediate", regulatory_ref: "Reg 10" });
  if (allAppts > 0 && attendRate < 70) recommendations.push({ rank: ++rank, recommendation: `Investigate low CAMHS attendance (${attendRate}%) — identify and address barriers to engagement.`, urgency: "soon", regulatory_ref: "Reg 33" });
  if (rejected.length >= 2) recommendations.push({ rank: ++rank, recommendation: `Review ${rejected.length} rejected referrals — strengthen referral evidence or consider alternative services.`, urgency: "soon", regulatory_ref: "Reg 10" });
  if (score < 65) recommendations.push({ rank: ++rank, recommendation: "Develop mental health pathway improvement plan with CAMHS and specialist services.", urgency: "planned", regulatory_ref: "Reg 10" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (camhs_rating === "outstanding") insights.push({ text: "CAMHS and specialist referral pathways are outstanding — children's mental health and specialist needs are proactively managed.", severity: "positive" });
  if (camhs_rating === "inadequate") insights.push({ text: "CAMHS and specialist access is inadequate — children's mental health and specialist needs are significantly unmet.", severity: "critical" });
  if (emergency_referrals.length >= 3) insights.push({ text: `${emergency_referrals.length} emergency mental health referrals suggest high therapeutic need — consider whether current placement support is sufficient.`, severity: "warning" });
  if (rejected.length >= 2 && (avgWait ?? 0) > 28) insights.push({ text: "Rejected referrals combined with long waits suggest systemic access barriers — joint commissioning review recommended.", severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (camhs_rating === "outstanding") headline = `Outstanding specialist referral pathways — ${active.length} active CAMHS referrals, ${attendRate}% attendance.`;
  else if (camhs_rating === "good") headline = `Good specialist access — ${waiting.length > 0 ? `${waiting.length} on waitlist` : "no children waiting"}, ${concerns.length > 0 ? `${concerns.length} area(s) to address` : "consistent engagement"}.`;
  else if (camhs_rating === "adequate") headline = `Adequate specialist access — ${waiting.length} child(ren) waiting, pathway improvements needed.`;
  else headline = `Specialist access inadequate — ${waiting.length} child(ren) waiting, ${emergency_referrals.length > 0 ? `${emergResponseRate}% emergency response` : "urgent pathway overhaul required"}.`;

  return {
    camhs_rating, camhs_score: score, headline,
    active_referrals: active.length, children_waiting: waiting.length,
    average_wait_days: avgWait, appointment_attendance_rate: attendRate,
    emergency_response_rate: emergResponseRate, specialist_coverage_rate: specialistCoverageRate,
    strengths, concerns, recommendations, insights,
  };
}
