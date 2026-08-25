// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RESTRICTIVE PRACTICE INTELLIGENCE ENGINE
// Per-child: restraint analysis — frequency, duration, escalation patterns,
// debrief compliance, injury tracking, notification compliance, review status.
// CHR 2015 Reg 19, 20, 35. SCCIF: "Safety of children."
// Pure deterministic — no DB, no LLM, no side effects.
// ══════════════════════════════════════════════════════════════════════════════

import { rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RestraintStaffInput {
  staff_id: string;
  role: string;
  team_teach_trained?: boolean;
}

export interface RestraintInjuryInput {
  person: string;
  description: string;
}

export interface RestraintInput {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  reason: string;
  restraint_type: string;
  staff_involved: RestraintStaffInput[];
  de_escalation_attempts: string[];
  injuries: RestraintInjuryInput[];
  child_debriefed: boolean;
  staff_debriefed: boolean;
  body_map_completed: boolean;
  medical_check_completed: boolean;
  review_status: string;
  reviewed_by: string;
  linked_incident_id: string | null;
  notifications_sent: number;
  has_antecedent: boolean;
  has_justification: boolean;
}

export interface ChildRestrictivePracticeInput {
  today: string;
  child_id: string;
  child_name: string;
  restraints: RestraintInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RestrictivePracticeRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_restraints";

export interface FrequencyProfile {
  total_restraints: number;
  restraints_30d: number;
  restraints_7d: number;
  restraints_90d: number;
  frequency_trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  avg_per_month_90d: number | null;
  days_since_last: number | null;
}

export interface DurationProfile {
  avg_duration_minutes: number | null;
  max_duration_minutes: number | null;
  min_duration_minutes: number | null;
  duration_trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  long_restraints_count: number; // >10 minutes
}

export interface ComplianceProfile {
  child_debrief_rate: number | null;
  staff_debrief_rate: number | null;
  body_map_rate: number | null;
  medical_check_rate: number | null;
  review_completion_rate: number | null;
  pending_reviews: number;
  notification_rate: number | null;
  antecedent_recorded_rate: number | null;
  justification_recorded_rate: number | null;
  de_escalation_documented_rate: number | null;
}

export interface PatternProfile {
  by_reason: { reason: string; count: number }[];
  by_type: { type: string; count: number }[];
  by_time_of_day: { period: string; count: number }[];
  unique_staff_involved: number;
  injury_count: number;
  child_injury_count: number;
}

export interface ChildRestrictivePracticeResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  restrictive_practice_rating: RestrictivePracticeRating;
  restrictive_practice_score: number | null;
  headline: string;
  frequency: FrequencyProfile;
  duration: DurationProfile;
  compliance: ComplianceProfile;
  patterns: PatternProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string | null }[];
  insights: { severity: "critical" | "warning" | "positive"; text: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Was `den === 0 ? 0 : …`: nothing recorded read as 0%.
function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function timeOfDayPeriod(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// ── Main Compute Function ───────────────────────────────────────────────────

export function computeChildRestrictivePractice(input: ChildRestrictivePracticeInput): ChildRestrictivePracticeResult {
  const { today, child_id, child_name, restraints } = input;

  // ── No restraints path ──────────────────────────────────────────────────
  if (restraints.length === 0) {
    return {
      generated_at: today,
      child_id,
      child_name,
      restrictive_practice_rating: "no_restraints",
      restrictive_practice_score: 0,
      headline: `${child_name} — no_restraints: No restraint episodes recorded.`,
      frequency: {
        total_restraints: 0, restraints_30d: 0, restraints_7d: 0, restraints_90d: 0,
        frequency_trend: "insufficient_data", avg_per_month_90d: 0, days_since_last: null,
      },
      duration: {
        avg_duration_minutes: null, max_duration_minutes: null, min_duration_minutes: null,
        duration_trend: "insufficient_data", long_restraints_count: 0,
      },
      compliance: {
        child_debrief_rate: null, staff_debrief_rate: null, body_map_rate: null,
        medical_check_rate: null, review_completion_rate: null, pending_reviews: 0,
        notification_rate: null, antecedent_recorded_rate: null,
        justification_recorded_rate: null, de_escalation_documented_rate: null,
      },
      patterns: { by_reason: [], by_type: [], by_time_of_day: [], unique_staff_involved: 0, injury_count: 0, child_injury_count: 0 },
      strengths: [`No restraint episodes recorded for ${child_name} — positive indicator of de-escalation effectiveness.`],
      concerns: [],
      recommendations: [],
      insights: [{ severity: "positive", text: `${child_name} has no restraint episodes on record. This suggests effective behaviour support and de-escalation strategies are in place.` }],
    };
  }

  // ── Time windows ────────────────────────────────────────────────────────
  const sorted = [...restraints].sort((a, b) => a.date.localeCompare(b.date));
  const r7d = restraints.filter((r) => daysBetween(r.date, today) >= 0 && daysBetween(r.date, today) <= 7);
  const r30d = restraints.filter((r) => daysBetween(r.date, today) >= 0 && daysBetween(r.date, today) <= 30);
  const r90d = restraints.filter((r) => daysBetween(r.date, today) >= 0 && daysBetween(r.date, today) <= 90);
  const rPrior30d = restraints.filter((r) => {
    const gap = daysBetween(r.date, today);
    return gap > 30 && gap <= 60;
  });

  // ── Frequency ───────────────────────────────────────────────────────────
  const lastRestraint = sorted[sorted.length - 1];
  const daysSinceLast = daysBetween(lastRestraint.date, today);

  let frequencyTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" = "insufficient_data";
  if (r30d.length + rPrior30d.length >= 2) {
    const diff = r30d.length - rPrior30d.length;
    if (diff >= 2) frequencyTrend = "increasing";
    else if (diff <= -2) frequencyTrend = "decreasing";
    else frequencyTrend = "stable";
  }

  const avgPerMonth90d = r90d.length > 0 ? Math.round((r90d.length / 3) * 10) / 10 : null;

  const frequency: FrequencyProfile = {
    total_restraints: restraints.length,
    restraints_30d: r30d.length,
    restraints_7d: r7d.length,
    restraints_90d: r90d.length,
    frequency_trend: frequencyTrend,
    avg_per_month_90d: avgPerMonth90d,
    days_since_last: daysSinceLast >= 0 ? daysSinceLast : null,
  };

  // ── Duration ────────────────────────────────────────────────────────────
  const durations90d = r90d.map((r) => r.duration_minutes);
  const durationsPrior = rPrior30d.map((r) => r.duration_minutes);
  const longRestraints = r90d.filter((r) => r.duration_minutes > 10);

  let durationTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" = "insufficient_data";
  if (durations90d.length >= 2 && durationsPrior.length >= 1) {
    const avgRecent = durations90d.reduce((s, n) => s + n, 0) / durations90d.length;
    const avgPrior = durationsPrior.reduce((s, n) => s + n, 0) / durationsPrior.length;
    if (avgRecent - avgPrior >= 2) durationTrend = "increasing";
    else if (avgPrior - avgRecent >= 2) durationTrend = "decreasing";
    else durationTrend = "stable";
  }

  const duration: DurationProfile = {
    avg_duration_minutes: avg(durations90d),
    max_duration_minutes: durations90d.length > 0 ? Math.max(...durations90d) : null,
    min_duration_minutes: durations90d.length > 0 ? Math.min(...durations90d) : null,
    duration_trend: durationTrend,
    long_restraints_count: longRestraints.length,
  };

  // ── Compliance ──────────────────────────────────────────────────────────
  const childDebriefed = r90d.filter((r) => r.child_debriefed).length;
  const staffDebriefed = r90d.filter((r) => r.staff_debriefed).length;
  const bodyMapDone = r90d.filter((r) => r.body_map_completed).length;
  const medCheckDone = r90d.filter((r) => r.medical_check_completed).length;
  const reviewed = r90d.filter((r) => r.review_status === "reviewed" || r.review_status === "referred_lado").length;
  const pendingReviews = r90d.filter((r) => r.review_status !== "reviewed" && r.review_status !== "referred_lado").length;
  const notified = r90d.filter((r) => r.notifications_sent > 0).length;
  const withAntecedent = r90d.filter((r) => r.has_antecedent).length;
  const withJustification = r90d.filter((r) => r.has_justification).length;
  const withDeEscalation = r90d.filter((r) => r.de_escalation_attempts.length > 0).length;

  const compliance: ComplianceProfile = {
    child_debrief_rate: rate(childDebriefed, r90d.length),
    staff_debrief_rate: rate(staffDebriefed, r90d.length),
    body_map_rate: rate(bodyMapDone, r90d.length),
    medical_check_rate: rate(medCheckDone, r90d.length),
    review_completion_rate: rate(reviewed, r90d.length),
    pending_reviews: pendingReviews,
    notification_rate: rate(notified, r90d.length),
    antecedent_recorded_rate: rate(withAntecedent, r90d.length),
    justification_recorded_rate: rate(withJustification, r90d.length),
    de_escalation_documented_rate: rate(withDeEscalation, r90d.length),
  };

  // ── Patterns ────────────────────────────────────────────────────────────
  const reasonMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  const todMap = new Map<string, number>();
  const allStaff = new Set<string>();
  let injuryCount = 0;
  let childInjuryCount = 0;

  for (const r of r90d) {
    reasonMap.set(r.reason, (reasonMap.get(r.reason) ?? 0) + 1);
    typeMap.set(r.restraint_type, (typeMap.get(r.restraint_type) ?? 0) + 1);
    const period = timeOfDayPeriod(r.start_time);
    todMap.set(period, (todMap.get(period) ?? 0) + 1);
    for (const s of r.staff_involved) allStaff.add(s.staff_id);
    injuryCount += r.injuries.length;
    childInjuryCount += r.injuries.filter((inj) => inj.person === child_id || inj.person.startsWith("yp_")).length;
  }

  const patterns: PatternProfile = {
    by_reason: Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    by_type: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    by_time_of_day: Array.from(todMap.entries()).map(([period, count]) => ({ period, count })).sort((a, b) => b.count - a.count),
    unique_staff_involved: allStaff.size,
    injury_count: injuryCount,
    child_injury_count: childInjuryCount,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  // For restraints, FEWER is better. Start at a lower base and build up with compliance.
  let score = 55;

  // Frequency penalty (more restraints = lower score)
  if (r30d.length === 0) score += 15;
  else if (r30d.length === 1) score += 5;
  else if (r30d.length <= 3) score -= 5;
  else if (r30d.length <= 5) score -= 12;
  else score -= 20;

  // Frequency trend
  if (frequencyTrend === "decreasing") score += 5;
  if (frequencyTrend === "increasing") score -= 8;

  // Duration (shorter is better)
  if (duration.avg_duration_minutes !== null) {
    if (duration.avg_duration_minutes <= 3) score += 5;
    else if (duration.avg_duration_minutes <= 5) score += 2;
    else if (duration.avg_duration_minutes > 10) score -= 8;
  }
  if (longRestraints.length > 0) score -= 3 * longRestraints.length;

  // Compliance bonuses
  if ((compliance.child_debrief_rate ?? 0) >= 90) score += 5;
  else if ((compliance.child_debrief_rate ?? 0) < 50 && r90d.length > 0) score -= 8;
  if ((compliance.staff_debrief_rate ?? 0) >= 90) score += 3;
  if ((compliance.body_map_rate ?? 0) >= 90) score += 3;
  if ((compliance.review_completion_rate ?? 0) >= 80) score += 5;
  else if (pendingReviews >= 2) score -= 5;
  if ((compliance.de_escalation_documented_rate ?? 0) >= 90) score += 5;
  else if ((compliance.de_escalation_documented_rate ?? 0) < 50 && r90d.length > 0) score -= 5;
  if ((compliance.notification_rate ?? 0) >= 90) score += 3;

  // Injuries (heavy penalty)
  if (childInjuryCount > 0) score -= 10 * childInjuryCount;
  if (injuryCount > 0 && childInjuryCount === 0) score -= 3;

  score = clamp(Math.round(score), 0, 100);

  // ── Rating ──────────────────────────────────────────────────────────────
  let rating: RestrictivePracticeRating;
  if (score >= 80) rating = "outstanding";
  else if (score >= 65) rating = "good";
  else if (score >= 45) rating = "adequate";
  else rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (r30d.length === 0 && r90d.length > 0) strengths.push("No restraint episodes in the last 30 days — positive trajectory.");
  if (frequencyTrend === "decreasing") strengths.push("Restraint frequency is decreasing — behaviour support strategies appear effective.");
  if ((compliance.child_debrief_rate ?? 0) >= 90 && r90d.length >= 2) strengths.push(`${(compliance.child_debrief_rate ?? 0)}% child debrief rate — excellent post-incident support.`);
  if ((compliance.staff_debrief_rate ?? 0) >= 90 && r90d.length >= 2) strengths.push(`${(compliance.staff_debrief_rate ?? 0)}% staff debrief rate — supporting reflective practice.`);
  if (compliance.de_escalation_documented_rate === 100 && r90d.length >= 2) strengths.push("De-escalation attempts documented in every episode — evidence of least-restrictive approach.");
  if ((compliance.body_map_rate ?? 0) >= 90 && r90d.length >= 2) strengths.push("Body maps completed consistently — strong safeguarding documentation.");
  if (duration.avg_duration_minutes !== null && duration.avg_duration_minutes <= 3) strengths.push(`Average restraint duration only ${duration.avg_duration_minutes} minutes — minimum force principle upheld.`);
  if (injuryCount === 0 && r90d.length >= 2) strengths.push("No injuries recorded across all episodes — safe practice.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (r30d.length >= 3) concerns.push(`${r30d.length} restraint episodes in 30 days — frequency is a concern (Reg 20).`);
  if (frequencyTrend === "increasing") concerns.push("Restraint frequency is increasing — current behaviour support plan may need review.");
  if (longRestraints.length > 0) concerns.push(`${longRestraints.length} restraint(s) exceeded 10 minutes — proportionality review needed.`);
  if (childInjuryCount > 0) concerns.push(`${childInjuryCount} injury/injuries to ${child_name} during restraint — safeguarding concern (Reg 19).`);
  if ((compliance.child_debrief_rate ?? 0) < 80 && r90d.length >= 2) concerns.push(`Child debrief rate only ${(compliance.child_debrief_rate ?? 0)}% — post-incident recovery process incomplete.`);
  if (pendingReviews >= 2) concerns.push(`${pendingReviews} restraint episode(s) pending review — management oversight gap.`);
  if ((compliance.de_escalation_documented_rate ?? 0) < 80 && r90d.length >= 2) concerns.push(`De-escalation documentation only ${(compliance.de_escalation_documented_rate ?? 0)}% — must evidence least-restrictive approach.`);
  if ((compliance.notification_rate ?? 0) < 80 && r90d.length >= 2) concerns.push(`Notification compliance only ${(compliance.notification_rate ?? 0)}% — Reg 35 requires timely notification.`);
  if (durationTrend === "increasing") concerns.push("Average restraint duration is increasing — risk of disproportionate practice.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ChildRestrictivePracticeResult["recommendations"] = [];
  let rank = 0;

  if (childInjuryCount > 0) recs.push({ rank: ++rank, recommendation: `Review all incidents resulting in injury to ${child_name}. Consider referral to LADO if pattern identified.`, urgency: "immediate", regulatory_ref: "Reg 19" });
  if (r30d.length >= 3) recs.push({ rank: ++rank, recommendation: "Convene multi-disciplinary meeting to review behaviour support plan — frequency warrants urgent review.", urgency: "immediate", regulatory_ref: "Reg 20" });
  if (frequencyTrend === "increasing") recs.push({ rank: ++rank, recommendation: "Escalating restraint pattern requires therapeutic assessment and updated behaviour support plan.", urgency: "immediate", regulatory_ref: "Reg 20" });
  if (pendingReviews >= 2) recs.push({ rank: ++rank, recommendation: `Complete ${pendingReviews} outstanding restraint reviews — RM must sign off all episodes.`, urgency: "soon", regulatory_ref: "Reg 35" });
  if ((compliance.child_debrief_rate ?? 0) < 80 && r90d.length >= 2) recs.push({ rank: ++rank, recommendation: "Ensure post-incident debrief with child within 24 hours of every restraint episode.", urgency: "soon", regulatory_ref: "Reg 19" });
  if ((compliance.de_escalation_documented_rate ?? 0) < 80 && r90d.length >= 2) recs.push({ rank: ++rank, recommendation: "Document de-escalation strategies attempted before every restraint — essential evidence for Ofsted.", urgency: "soon", regulatory_ref: "Reg 19" });
  if (longRestraints.length > 0) recs.push({ rank: ++rank, recommendation: "Review extended-duration restraints with Team Teach lead — consider technique refresher.", urgency: "planned", regulatory_ref: "Reg 20" });
  if ((compliance.body_map_rate ?? 0) < 90 && r90d.length >= 2) recs.push({ rank: ++rank, recommendation: "Body map must be completed after every restraint — currently incomplete.", urgency: "soon", regulatory_ref: "Reg 19" });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ChildRestrictivePracticeResult["insights"] = [];

  if (r30d.length >= 3 || frequencyTrend === "increasing") {
    insights.push({ severity: "critical", text: `Cara detects ${r90d.length} restraint episodes in 90 days${frequencyTrend === "increasing" ? " with an escalating trend" : ""}. Under Reg 19/20, Ofsted will scrutinise whether the home is using restraint as a last resort and whether the current behaviour support plan is adequate.` });
  }
  if (childInjuryCount > 0) {
    insights.push({ severity: "critical", text: `${childInjuryCount} injury/injuries sustained by ${child_name} during restraint episodes. This is a priority safeguarding indicator — inspectors will examine proportionality, technique, and post-incident care.` });
  }
  if (pendingReviews >= 2) {
    insights.push({ severity: "warning", text: `${pendingReviews} restraint episodes awaiting management review. Delays in review suggest insufficient oversight — a likely finding under SCCIF "Leadership and management."` });
  }
  if ((compliance.child_debrief_rate ?? 0) < 80 && r90d.length >= 2) {
    insights.push({ severity: "warning", text: `Child debrief rate is ${compliance.child_debrief_rate}%. Post-incident recovery is therapeutic and regulatory — ${child_name} must have the opportunity to process the experience.` });
  }
  if (rating === "outstanding" || (r30d.length === 0 && r90d.length > 0 && (compliance.child_debrief_rate ?? 0) >= 90)) {
    insights.push({ severity: "positive", text: `${r30d.length === 0 ? "No recent restraints" : "Low restraint frequency"} with strong compliance practices for ${child_name}. Evidence of effective de-escalation, therapeutic response, and regulatory compliance.` });
  }
  if (frequencyTrend === "decreasing" && r90d.length >= 3) {
    insights.push({ severity: "positive", text: `Restraint frequency is decreasing for ${child_name} — behaviour support strategies are having a positive impact. Maintain current approach and document progress.` });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [`${child_name} — ${rating}`];
  if (r90d.length > 0) {
    parts.push(`${r90d.length} episode(s) in 90d`);
    if (r30d.length > 0) parts.push(`${r30d.length} in last 30d`);
    if (childInjuryCount > 0) parts.push(`${childInjuryCount} injury`);
  } else {
    parts.push("no episodes in 90 days");
  }
  const headline = parts.join(": ").replace(/: /, ": ") + ".";

  return {
    generated_at: today,
    child_id,
    child_name,
    restrictive_practice_rating: rating,
    restrictive_practice_score: score,
    headline,
    frequency,
    duration,
    compliance,
    patterns,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
