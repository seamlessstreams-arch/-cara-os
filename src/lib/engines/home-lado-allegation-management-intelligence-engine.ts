// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LADO & ALLEGATION MANAGEMENT INTELLIGENCE ENGINE
// Home-level: analyses LADO referrals, allegation patterns, staff training,
// and safeguarding compliance to surface intelligence for registered managers.
// CHR 2015 Sch 2: fitness of workers. WSCB LADO procedures.
// Reg 12: health & safety. Reg 13: child protection.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LadoReferralInput {
  id: string;
  date_referred: string;
  allegation_type: string; // "physical_abuse"|"emotional_abuse"|"sexual_abuse"|"neglect"|"inappropriate_behaviour"|"inappropriate_relationship"|"boundary_violation"|"other"
  status: string; // "initial_assessment"|"lado_contacted"|"strategy_meeting"|"investigation"|"outcome_reached"|"closed"|"nfa"
  outcome: string; // "substantiated"|"unsubstantiated"|"unfounded"|"malicious"|"pending"
  ofsted_notified: boolean;
  dbs_referral: boolean;
  police_involved: boolean;
  strategy_meeting_held: boolean;
  has_support_for_child: boolean;
  has_support_for_staff: boolean;
  has_lesson_learned: boolean;
  days_to_close: number; // -1 if still open
}

export interface AllegationPatternInput {
  id: string;
  staff_id: string;
  allegation_count: number;
  substantiated_count: number;
}

export interface SafeguardingTrainingInput {
  id: string;
  staff_id: string;
  safer_recruitment_trained: boolean;
  allegation_awareness_trained: boolean;
  last_training_date: string;
}

export interface LadoAllegationInput {
  today: string;
  total_staff: number;
  referrals: LadoReferralInput[];
  patterns: AllegationPatternInput[];
  training: SafeguardingTrainingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LadoAllegationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LadoAllegationResult {
  lado_rating: LadoAllegationRating;
  lado_score: number | null;
  headline: string;
  total_referrals: number;
  open_referrals: number;
  ofsted_notification_rate: number | null;
  resolution_rate: number | null;
  average_days_to_close: number | null;
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): LadoAllegationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeLadoAllegationManagement(
  input: LadoAllegationInput,
): LadoAllegationResult {
  const { today, total_staff, referrals, patterns, training } = input;

  // ── Insufficient data ──────────────────────────────────────────────
  if (total_staff === 0) {
    return {
      lado_rating: "insufficient_data",
      lado_score: 0,
      headline: "No staff data available — unable to assess LADO & allegation management.",
      total_referrals: 0,
      open_referrals: 0,
      ofsted_notification_rate: 0,
      resolution_rate: 0,
      average_days_to_close: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────
  const totalReferrals = referrals.length;

  const closedOrNfa = referrals.filter(
    (r) => r.status === "closed" || r.status === "nfa",
  );
  const openReferrals = referrals.filter(
    (r) => r.status !== "closed" && r.status !== "nfa",
  );

  const ofstedNotifiedCount = referrals.filter((r) => r.ofsted_notified).length;
  const ofstedNotificationRate =
    totalReferrals > 0 ? rate(ofstedNotifiedCount, totalReferrals) : 0;

  const resolutionRate =
    totalReferrals > 0 ? rate(closedOrNfa.length, totalReferrals) : 0;

  const closedWithDays = referrals.filter((r) => r.days_to_close > 0);
  const averageDaysToClose =
    closedWithDays.length > 0
      ? Math.round(
          closedWithDays.reduce((sum, r) => sum + r.days_to_close, 0) /
            closedWithDays.length,
        )
      : null;

  // ── Strategy meeting rate ──────────────────────────────────────────
  const strategyMeetingHeld = referrals.filter(
    (r) => r.strategy_meeting_held,
  ).length;
  const strategyMeetingRate =
    totalReferrals > 0 ? rate(strategyMeetingHeld, totalReferrals) : 0;

  // ── Training coverage ──────────────────────────────────────────────
  const saferRecruitmentTrained = training.filter(
    (t) => t.safer_recruitment_trained,
  ).length;
  const trainingCoverage =
    training.length > 0 ? rate(saferRecruitmentTrained, training.length) : 0;

  // ── Lessons learned rate ───────────────────────────────────────────
  const lessonsLearnedCount = referrals.filter(
    (r) => r.has_lesson_learned,
  ).length;
  const lessonsLearnedRate =
    totalReferrals > 0 ? rate(lessonsLearnedCount, totalReferrals) : 0;

  // ── Scoring ───────────────────────────────────────────────────────
  let score = 52;

  // 1. Ofsted notification compliance (±5)
  if (totalReferrals > 0) {
    if (meets(ofstedNotificationRate, 95)) score += 5;
    else if (meets(ofstedNotificationRate, 80)) score += 2;
    else if (meets(ofstedNotificationRate, 60)) score += 0;
    else score -= 5;
  }

  // 2. Resolution rate (closed+nfa / total) (+6/-5)
  if (totalReferrals > 0) {
    if (meets(resolutionRate, 90)) score += 6;
    else if (meets(resolutionRate, 70)) score += 3;
    else if (meets(resolutionRate, 50)) score += 0;
    else score -= 5;
  }

  // 3. Timeliness (avg days to close) (+5/-5)
  if (closedWithDays.length > 0) {
    if ((averageDaysToClose ?? 0) <= 30) score += 5;
    else if ((averageDaysToClose ?? 0) <= 60) score += 2;
    else if ((averageDaysToClose ?? 0) <= 90) score += 0;
    else score -= 5;
  } else {
    score += 2; // no closed referrals
  }

  // 4. Strategy meeting compliance (+5/-4)
  if (totalReferrals > 0) {
    if (meets(strategyMeetingRate, 95)) score += 5;
    else if (meets(strategyMeetingRate, 80)) score += 2;
    else if (meets(strategyMeetingRate, 50)) score += 0;
    else score -= 4;
  }

  // 5. Staff training coverage (safer_recruitment_trained %) (+4/-4)
  if (training.length > 0) {
    if (meets(trainingCoverage, 95)) score += 4;
    else if (meets(trainingCoverage, 80)) score += 1;
    else if (meets(trainingCoverage, 60)) score += 0;
    else score -= 4;
  }

  // 6. Learning from allegations (has_lesson_learned %) (+5/-5)
  if (totalReferrals > 0) {
    if (meets(lessonsLearnedRate, 90)) score += 5;
    else if (meets(lessonsLearnedRate, 70)) score += 2;
    else if (meets(lessonsLearnedRate, 40)) score += 0;
    else score -= 5;
  } else {
    score += 2; // no referrals
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(ofstedNotificationRate, 95) && totalReferrals > 0) {
    strengths.push(
      `Ofsted notification rate at ${ofstedNotificationRate}% — strong regulatory compliance.`,
    );
  }
  if (meets(resolutionRate, 90) && totalReferrals > 0) {
    strengths.push(
      `${resolutionRate}% of allegations resolved — effective case management.`,
    );
  }
  if (
    closedWithDays.length > 0 &&
    closedWithDays.every((r) => r.days_to_close <= 30)
  ) {
    strengths.push(
      "All closed referrals resolved within 30 days — timely allegation handling.",
    );
  }
  if (meets(strategyMeetingRate, 95) && totalReferrals > 0) {
    strengths.push(
      `Strategy meetings held for ${strategyMeetingRate}% of referrals — robust multi-agency response.`,
    );
  }
  if (meets(trainingCoverage, 95) && training.length > 0) {
    strengths.push(
      `${trainingCoverage}% staff trained in safer recruitment — safeguarding culture embedded.`,
    );
  }
  if (lessonsLearnedRate === 100 && totalReferrals > 0) {
    strengths.push(
      "100% of referrals have lessons learned documented — reflective practice in place.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];

  // Open referrals > 60 days old
  for (const r of openReferrals) {
    const daysSinceReferred = daysBetween(r.date_referred, today);
    if (daysSinceReferred > 60) {
      concerns.push(
        `Referral ${r.id} has been open for ${daysSinceReferred} days — exceeds 60-day threshold.`,
      );
    }
  }

  // Substantiated allegations with no DBS referral
  const substantiatedNoDbs = referrals.filter(
    (r) => r.outcome === "substantiated" && !r.dbs_referral,
  );
  for (const r of substantiatedNoDbs) {
    concerns.push(
      `Substantiated allegation ${r.id} has no DBS referral — regulatory requirement under CHR 2015 Sch 2.`,
    );
  }

  // Ofsted notification rate < 80%
  if (below(ofstedNotificationRate, 80) && totalReferrals > 0) {
    concerns.push(
      `Ofsted notification rate at ${ofstedNotificationRate}% — below 80% threshold.`,
    );
  }

  // Pattern staff (allegation_count >= 2)
  const patternStaff = patterns.filter((p) => p.allegation_count >= 2);
  for (const p of patternStaff) {
    concerns.push(
      `Staff member ${p.staff_id} has ${p.allegation_count} allegations — pattern requires management attention.`,
    );
  }

  // Staff training < 60%
  if (below(trainingCoverage, 60) && training.length > 0) {
    concerns.push(
      `Only ${trainingCoverage}% of staff trained in safer recruitment — significant safeguarding gap.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────
  const recs: LadoAllegationResult["recommendations"] = [];
  let rank = 1;

  if (substantiatedNoDbs.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete DBS referral for ${substantiatedNoDbs.length} substantiated allegation(s) — mandatory regulatory requirement.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (below(ofstedNotificationRate, 80) && totalReferrals > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Review Ofsted notification procedures — all allegations must be notified promptly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  const longOpen = openReferrals.filter(
    (r) => daysBetween(r.date_referred, today) > 60,
  );
  if (longOpen.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Progress ${longOpen.length} open referral(s) exceeding 60 days — set resolution targets with LADO.`,
      urgency: "immediate",
      regulatory_ref: "WSCB LADO",
    });
  }

  if (below(trainingCoverage, 60) && training.length > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Implement mandatory safer recruitment training for all staff — coverage is critically low.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (patternStaff.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review allegation patterns for ${patternStaff.length} staff member(s) with multiple allegations — consider supervision and support plans.`,
      urgency: "soon",
      regulatory_ref: "WSCB LADO",
    });
  }

  // Limit to 5
  const recommendations = recs.slice(0, 5);

  // ── Insights ──────────────────────────────────────────────────────
  const insights: LadoAllegationResult["insights"] = [];

  // Positive: no referrals + good training
  if (totalReferrals === 0 && meets(trainingCoverage, 95)) {
    insights.push({
      text: "No allegations with strong safeguarding training culture — preventative approach is working.",
      severity: "positive",
    });
  }

  // Critical: substantiated allegations
  const substantiatedCount = referrals.filter(
    (r) => r.outcome === "substantiated",
  ).length;
  if (substantiatedCount > 0) {
    insights.push({
      text: `${substantiatedCount} substantiated allegation(s) on record — ensure all post-outcome actions are completed including DBS referral and lessons learned.`,
      severity: "critical",
    });
  }

  // Warning: slow resolution
  if ((averageDaysToClose ?? 0) > 60 && closedWithDays.length > 0) {
    insights.push({
      text: `Average resolution time is ${averageDaysToClose} days — exceeds 60-day best practice target. Escalate with LADO to improve timeliness.`,
      severity: "warning",
    });
  }

  // Limit to 3
  const limitedInsights = insights.slice(0, 3);

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding LADO & allegation management with ${ofstedNotificationRate}% Ofsted notification and ${resolutionRate}% resolution rate.`;
  } else if (rating === "good") {
    headline =
      "Good allegation handling — minor gaps in timeliness or compliance to address.";
  } else if (rating === "adequate") {
    headline =
      "Adequate allegation management — strategy meetings, training, or notification gaps need strengthening.";
  } else {
    headline =
      "Inadequate — serious gaps in allegation response, notification, and safeguarding compliance.";
  }

  return {
    lado_rating: rating,
    lado_score: score,
    headline,
    total_referrals: totalReferrals,
    open_referrals: openReferrals.length,
    ofsted_notification_rate: ofstedNotificationRate,
    resolution_rate: resolutionRate,
    average_days_to_close: averageDaysToClose,
    strengths,
    concerns,
    recommendations,
    insights: limitedInsights,
  };
}
