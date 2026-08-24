// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MENTAL HEALTH INTELLIGENCE ENGINE
// Home-level: aggregates mental health check-ins, therapy sessions,
// self-harm safety plans, and therapeutic input referrals.
// CHR 2015 Reg 7/10: "Welfare — promote physical/mental health."
// SCCIF: "Children's mental health needs are identified and responded to."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface MentalHealthCheckInInput {
  id: string;
  child_id: string;
  date: string;
  mood_rating: number;              // 1-5
  sleep_quality: string;            // poor | disrupted | ok | good | great
  appetite: string;                 // skipped_meals | picked | ate_normally | hungry_ate_well
  energy: string;                   // exhausted | low | ok | good | buzzy
  flags_concerns: string[];
  staff_present: string;
  follow_up_action: string | null;
}

export interface TherapySessionInput {
  id: string;
  child_id: string;
  session_date: string;
  attended: boolean;
  pre_session_mood_rating: number;
  post_session_mood_rating: number;
  escalation_flags: string[];
}

export interface SafetyPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  status: string;                   // not_currently_needed | active_preventive | active_recent_incident | in_review
  child_signed_off: boolean;
  next_review_date: string;
  co_produced_with: string[];
  flags_for_review: string[];
}

export interface TherapeuticReferralInput {
  id: string;
  child_id: string;
  therapy_type: string;
  status: string;                   // pending | accepted | active | on_hold | completed | discharged | declined
  referral_date: string;
  start_date: string | null;
  waiting_weeks: number | null;
  next_appointment: string | null;
  review_date: string | null;
}

export interface HomeMentalHealthInput {
  today: string;
  check_ins: MentalHealthCheckInInput[];
  therapy_sessions: TherapySessionInput[];
  safety_plans: SafetyPlanInput[];
  therapeutic_referrals: TherapeuticReferralInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type MentalHealthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CheckInProfile {
  total_check_ins_30d: number;
  children_with_check_ins: number;
  check_in_coverage_rate: number | null;
  avg_mood_rating: number | null;
  low_mood_count: number;           // mood_rating <= 2
  high_mood_count: number;          // mood_rating >= 4
  flagged_check_ins: number;
  follow_up_rate: number | null;
}

export interface TherapyProfile {
  total_sessions_90d: number;
  attendance_rate: number | null;
  avg_mood_improvement: number | null;     // post - pre average
  sessions_with_escalation: number;
  children_in_therapy: number;
}

export interface SafetyPlanProfile {
  active_plans: number;
  recent_incident_plans: number;
  child_signed_rate: number | null;
  overdue_reviews: number;
  co_production_rate: number | null;
}

export interface ReferralProfile {
  active_referrals: number;
  pending_referrals: number;
  avg_waiting_weeks: number | null;
  children_with_therapy: number;
  therapy_coverage_rate: number | null;
}

export interface HomeMentalHealthResult {
  mental_health_rating: MentalHealthRating;
  mental_health_score: number | null;
  headline: string;
  check_ins: CheckInProfile;
  therapy: TherapyProfile;
  safety_plans: SafetyPlanProfile;
  referrals: ReferralProfile;
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

export function computeHomeMentalHealth(
  input: HomeMentalHealthInput,
): HomeMentalHealthResult {
  const { today, check_ins, therapy_sessions, safety_plans, therapeutic_referrals, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      mental_health_rating: "insufficient_data",
      mental_health_score: 0,
      headline: "No children in placement — mental health monitoring cannot be assessed.",
      check_ins: { total_check_ins_30d: 0, children_with_check_ins: 0, check_in_coverage_rate: null, avg_mood_rating: 0, low_mood_count: 0, high_mood_count: 0, flagged_check_ins: 0, follow_up_rate: null },
      therapy: { total_sessions_90d: 0, attendance_rate: null, avg_mood_improvement: 0, sessions_with_escalation: 0, children_in_therapy: 0 },
      safety_plans: { active_plans: 0, recent_incident_plans: 0, child_signed_rate: null, overdue_reviews: 0, co_production_rate: null },
      referrals: { active_referrals: 0, pending_referrals: 0, avg_waiting_weeks: 0, children_with_therapy: 0, therapy_coverage_rate: null },
      strengths: [],
      concerns: ["No children in placement — mental health analysis unavailable."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Check-ins (30-day window) ─────────────────────────────────────────
  const checkIns30d = check_ins.filter(c => {
    const d = daysBetween(c.date, today);
    return d >= 0 && d <= 30;
  });

  const childrenWithCheckIns = new Set(checkIns30d.map(c => c.child_id)).size;
  const checkInCoverageRate = pct(childrenWithCheckIns, total_children);

  const moodRatings = checkIns30d.map(c => c.mood_rating).filter(m => m > 0);
  const avgMood = moodRatings.length > 0
    ? Math.round((moodRatings.reduce((sum, m) => sum + m, 0) / moodRatings.length) * 10) / 10
    : null;
  const lowMood = moodRatings.filter(m => m <= 2).length;
  const highMood = moodRatings.filter(m => m >= 4).length;
  const flaggedCheckIns = checkIns30d.filter(c => c.flags_concerns.length > 0).length;
  const withFollowUp = checkIns30d.filter(c => c.follow_up_action !== null && c.follow_up_action !== "");
  const followUpRate = pct(withFollowUp.length, flaggedCheckIns > 0 ? flaggedCheckIns : checkIns30d.length);

  const checkInProfile: CheckInProfile = {
    total_check_ins_30d: checkIns30d.length,
    children_with_check_ins: childrenWithCheckIns,
    check_in_coverage_rate: checkInCoverageRate,
    avg_mood_rating: avgMood,
    low_mood_count: lowMood,
    high_mood_count: highMood,
    flagged_check_ins: flaggedCheckIns,
    follow_up_rate: followUpRate,
  };

  // ── Therapy Sessions (90-day window) ──────────────────────────────────
  const sessions90d = therapy_sessions.filter(s => {
    const d = daysBetween(s.session_date, today);
    return d >= 0 && d <= 90;
  });

  const attendedSessions = sessions90d.filter(s => s.attended);
  const attendanceRate = pct(attendedSessions.length, sessions90d.length);
  const moodImprovements = attendedSessions
    .filter(s => s.post_session_mood_rating > 0 && s.pre_session_mood_rating > 0)
    .map(s => s.post_session_mood_rating - s.pre_session_mood_rating);
  const avgMoodImprovement = moodImprovements.length > 0
    ? Math.round((moodImprovements.reduce((sum, d) => sum + d, 0) / moodImprovements.length) * 10) / 10
    : null;
  const sessionsWithEscalation = sessions90d.filter(s => s.escalation_flags.length > 0).length;
  const childrenInTherapy = new Set(sessions90d.map(s => s.child_id)).size;

  const therapyProfile: TherapyProfile = {
    total_sessions_90d: sessions90d.length,
    attendance_rate: attendanceRate,
    avg_mood_improvement: avgMoodImprovement,
    sessions_with_escalation: sessionsWithEscalation,
    children_in_therapy: childrenInTherapy,
  };

  // ── Safety Plans ──────────────────────────────────────────────────────
  const activePlans = safety_plans.filter(p =>
    p.status === "active_preventive" || p.status === "active_recent_incident" || p.status === "in_review",
  );
  const recentIncidentPlans = safety_plans.filter(p => p.status === "active_recent_incident").length;
  const signedPlans = activePlans.filter(p => p.child_signed_off);
  const childSignedRate = pct(signedPlans.length, activePlans.length);
  const overdueReviews = activePlans.filter(p => daysBetween(p.next_review_date, today) > 0).length;
  const coProduced = activePlans.filter(p => p.co_produced_with.length > 0);
  const coProductionRate = pct(coProduced.length, activePlans.length);

  const safetyPlanProfile: SafetyPlanProfile = {
    active_plans: activePlans.length,
    recent_incident_plans: recentIncidentPlans,
    child_signed_rate: childSignedRate,
    overdue_reviews: overdueReviews,
    co_production_rate: coProductionRate,
  };

  // ── Therapeutic Referrals ─────────────────────────────────────────────
  const activeReferrals = therapeutic_referrals.filter(r =>
    r.status === "active" || r.status === "accepted",
  ).length;
  const pendingReferrals = therapeutic_referrals.filter(r => r.status === "pending").length;
  const withWaiting = therapeutic_referrals.filter(r => r.waiting_weeks !== null && r.status === "pending");
  const avgWaiting = withWaiting.length > 0
    ? Math.round(withWaiting.reduce((sum, r) => sum + (r.waiting_weeks ?? 0), 0) / withWaiting.length)
    : null;
  const childrenWithTherapy = new Set(
    therapeutic_referrals
      .filter(r => r.status === "active" || r.status === "accepted")
      .map(r => r.child_id),
  ).size;
  const therapyCoverageRate = pct(childrenWithTherapy, total_children);

  const referralProfile: ReferralProfile = {
    active_referrals: activeReferrals,
    pending_referrals: pendingReferrals,
    avg_waiting_weeks: avgWaiting,
    children_with_therapy: childrenWithTherapy,
    therapy_coverage_rate: therapyCoverageRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Check-in coverage (±5) — all children should have regular check-ins
  if (checkInCoverageRate >= 100) score += 5;
  else if (checkInCoverageRate >= 75) score += 3;
  else if (checkInCoverageRate >= 50) score += 0;
  else if (checkInCoverageRate >= 25) score -= 2;
  else score -= 5;

  // mod2: Check-in frequency (±4) — sufficient volume of check-ins
  const checkInsPerChild = total_children > 0
    ? Math.round((checkIns30d.length / total_children) * 10) / 10
    : null;
  if ((checkInsPerChild ?? 0) >= 4) score += 4;
  else if ((checkInsPerChild ?? 0) >= 2) score += 2;
  else if ((checkInsPerChild ?? 0) >= 1) score += 0;
  else score -= 4;

  // mod3: Therapy engagement (±4) — attendance and outcomes
  if (sessions90d.length === 0) {
    // No therapy sessions — neutral if no referrals, slight penalty if pending
    if (pendingReferrals > 0) score -= 2;
    else score += 2;
  } else {
    if (attendanceRate >= 90 && (avgMoodImprovement ?? 0) > 0) score += 4;
    else if (attendanceRate >= 75) score += 2;
    else if (attendanceRate >= 50) score += 0;
    else score -= 4;
  }

  // mod4: Safety plan governance (±3) — for homes with active plans
  if (activePlans.length === 0) {
    score += 2; // No active plans needed = positive
  } else {
    if (childSignedRate >= 100 && coProductionRate >= 100 && overdueReviews === 0) score += 3;
    else if (childSignedRate >= 75 && overdueReviews === 0) score += 1;
    else if (overdueReviews > 0) score -= 2;
    else score += 0;
  }

  // mod5: Follow-up on concerns (±4) — response to flagged check-ins
  if (flaggedCheckIns === 0) {
    score += 2; // No flags = relatively stable
  } else {
    if (followUpRate >= 100) score += 4;
    else if (followUpRate >= 75) score += 2;
    else if (followUpRate >= 50) score += 0;
    else score -= 4;
  }

  // mod6: Mood trends (±3) — overall emotional wellbeing
  if (moodRatings.length === 0) {
    score -= 2;
  } else {
    const lowMoodRate = pct(lowMood, moodRatings.length);
    if (lowMoodRate === 0 && (avgMood ?? 0) >= 3.5) score += 3;
    else if (lowMoodRate <= 15) score += 1;
    else if (lowMoodRate <= 30) score += 0;
    else score -= 3;
  }

  // mod7: Overdue safety plan reviews (±3) — governance compliance
  if (activePlans.length === 0) {
    score += 1; // Neutral-positive
  } else if (overdueReviews === 0) {
    score += 3;
  } else if (overdueReviews === 1) {
    score += 0;
  } else {
    score -= 3;
  }

  // mod8: Escalation response (±2) — therapy sessions with escalation flags
  if (sessionsWithEscalation === 0) {
    score += 2;
  } else if (sessionsWithEscalation <= 2) {
    score += 0;
  } else {
    score -= 2;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let mental_health_rating: MentalHealthRating;
  if (score >= 80) mental_health_rating = "outstanding";
  else if (score >= 65) mental_health_rating = "good";
  else if (score >= 45) mental_health_rating = "adequate";
  else mental_health_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (checkInCoverageRate >= 100) strengths.push("Every child has mental health check-ins — emotional monitoring is embedded in daily practice.");
  if ((checkInsPerChild ?? 0) >= 4) strengths.push(`Averaging ${(checkInsPerChild ?? 0)} check-ins per child in 30 days — regular emotional pulse-taking.`);
  if (attendanceRate >= 90 && sessions90d.length > 0) strengths.push(`${attendanceRate}% therapy attendance rate — children are engaging with therapeutic support.`);
  if ((avgMoodImprovement ?? 0) > 0 && sessions90d.length > 0) strengths.push(`Positive mood improvement trend (+${(avgMoodImprovement ?? 0)}) after therapy sessions — therapeutic input is making a difference.`);
  if (activePlans.length > 0 && childSignedRate >= 100 && overdueReviews === 0) strengths.push("All safety plans co-signed by children with reviews on schedule — young people have ownership of their safety.");
  if (flaggedCheckIns > 0 && followUpRate >= 100) strengths.push("100% follow-up rate on flagged check-ins — concerns are acted on promptly.");

  // Concerns
  if (checkInCoverageRate < 100 && total_children > childrenWithCheckIns) {
    concerns.push(`${total_children - childrenWithCheckIns} child${(total_children - childrenWithCheckIns) > 1 ? "ren" : ""} without mental health check-ins in 30 days.`);
  }
  if (lowMood >= 3 && moodRatings.length > 0) {
    concerns.push(`${lowMood} low mood rating${lowMood > 1 ? "s" : ""} (≤2/5) in 30 days — persistent low mood requires clinical attention.`);
  }
  if (recentIncidentPlans > 0) {
    concerns.push(`${recentIncidentPlans} safety plan${recentIncidentPlans > 1 ? "s" : ""} activated due to recent self-harm incident${recentIncidentPlans > 1 ? "s" : ""}.`);
  }
  if (overdueReviews > 0) {
    concerns.push(`${overdueReviews} safety plan review${overdueReviews > 1 ? "s" : ""} overdue — plans must be kept current to be effective.`);
  }
  if (pendingReferrals > 0 && (avgWaiting ?? 0) > 8) {
    concerns.push(`${pendingReferrals} pending therapeutic referral${pendingReferrals > 1 ? "s" : ""} with average ${avgWaiting}-week wait — long waits increase risk.`);
  }
  if (attendanceRate < 60 && sessions90d.length > 0) {
    concerns.push(`Therapy attendance rate only ${attendanceRate}% — missed sessions undermine therapeutic progress.`);
  }
  if (flaggedCheckIns > 0 && followUpRate < 50) {
    concerns.push(`Only ${followUpRate}% follow-up rate on flagged mental health check-ins — concerns may go unaddressed.`);
  }

  // Recommendations
  if (checkInCoverageRate < 100) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure all children have regular mental health check-ins — weekly minimum for every child.", urgency: checkInCoverageRate < 50 ? "immediate" : "soon", regulatory_ref: "Reg 7" });
  }
  if (overdueReviews > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Complete overdue safety plan reviews — plans are only effective when current and responsive.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (flaggedCheckIns > 0 && followUpRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Follow up on all flagged mental health check-ins within 24 hours — document actions taken.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (pendingReferrals > 0) {
    recommendations.push({ rank: ++rank, recommendation: `Chase pending therapeutic referrals (${pendingReferrals} waiting) — consider interim support while waiting.`, urgency: (avgWaiting ?? 0) > 8 ? "immediate" : "soon", regulatory_ref: "Reg 10" });
  }
  if (attendanceRate < 75 && sessions90d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address barriers to therapy attendance — transport, timing, and emotional readiness should be reviewed.", urgency: "soon", regulatory_ref: "Reg 10" });
  }

  // Cara Insights
  if (checkInCoverageRate >= 100 && (checkInsPerChild ?? 0) >= 4 && (flaggedCheckIns === 0 || followUpRate >= 100)) {
    insights.push({ text: "Mental health monitoring is exemplary. Every child receives regular check-ins with prompt follow-up on any concerns. This proactive emotional awareness will be recognised by Ofsted as outstanding practice.", severity: "positive" });
  }
  if (lowMood >= 5 && moodRatings.length > 0 && pct(lowMood, moodRatings.length) >= 30) {
    insights.push({ text: `${pct(lowMood, moodRatings.length)}% of mood ratings are low (≤2/5). This sustained pattern of emotional distress across the home warrants a multi-disciplinary review. Consider whether the therapeutic environment is supporting recovery.`, severity: "critical" });
  }
  if (recentIncidentPlans >= 2) {
    insights.push({ text: `${recentIncidentPlans} safety plans are active due to recent self-harm incidents. This concentration of crisis-level need requires enhanced staffing, specialist consultation, and potential review of the home's therapeutic model.`, severity: "critical" });
  }
  if (sessionsWithEscalation >= 3) {
    insights.push({ text: `${sessionsWithEscalation} therapy sessions flagged escalation concerns. Work with therapists to develop coordinated de-escalation strategies between sessions.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (mental_health_rating === "outstanding") {
    headline = `Outstanding mental health monitoring — ${childrenWithCheckIns} children checked in, ${activePlans.length > 0 ? "safety plans current" : "no active concerns"}.`;
  } else if (mental_health_rating === "good") {
    headline = `Good mental health support — ${checkInsPerChild} check-ins/child in 30 days. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for attention." : ""}`;
  } else if (mental_health_rating === "adequate") {
    headline = `Mental health monitoring needs improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Mental health support is inadequate — significant gaps in monitoring, therapy engagement, or crisis response.`;
  }

  return {
    mental_health_rating,
    mental_health_score: score,
    headline,
    check_ins: checkInProfile,
    therapy: therapyProfile,
    safety_plans: safetyPlanProfile,
    referrals: referralProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
