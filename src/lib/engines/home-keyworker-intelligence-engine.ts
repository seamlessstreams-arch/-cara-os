// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME KEYWORKER INTELLIGENCE ENGINE
// Home-level: analyses keyworker session coverage, therapeutic quality,
// child engagement, mood improvement, follow-through, and theme diversity.
// CHR 2015 Reg 44 (Independent Person). SCCIF: "How well children are
// helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface KeyworkerSessionInput {
  id: string;
  child_id: string;
  session_date: string;
  duration_minutes: number;
  child_chose_format: boolean;
  themes_count: number;
  mood_before: number;              // 1–5 scale
  mood_after: number;               // 1–5 scale
  child_brought_up: boolean;        // did child raise topics?
  agreed_actions_child_count: number;
  child_satisfaction: number;       // 1–5 scale
  follow_up_date: string;           // "" if not set
  flags_raised_count: number;
}

export interface HomeKeyworkerInput {
  today: string;
  sessions: KeyworkerSessionInput[];
  total_children: number;
  lookback_days?: number;           // default 90
}

// ── Output Types ────────────────────────────────────────────────────────────

export type KeyworkerRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CoverageProfile {
  total_sessions: number;
  children_with_sessions: number;
  coverage_rate: number | null;
  avg_sessions_per_child: number | null;
  min_sessions_per_child: number | null;
  max_sessions_per_child: number | null;
}

export interface QualityProfile {
  avg_duration: number;
  avg_satisfaction: number;
  avg_themes: number;
  adequate_duration_rate: number | null;   // % of sessions ≥ 20 minutes
}

export interface EngagementProfile {
  child_chose_format_rate: number | null;
  child_brought_up_rate: number | null;
  child_actions_rate: number | null;       // % with at least 1 child action
}

export interface TherapeuticProfile {
  avg_mood_before: number;
  avg_mood_after: number;
  mood_improvement_rate: number | null;    // % that improved
  sessions_with_improvement: number;
}

export interface FollowUpProfile {
  follow_up_set_rate: number | null;
  overdue_follow_ups: number;
  flags_raised_total: number;
}

export interface KeyworkerInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface KeyworkerRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeKeyworkerResult {
  keyworker_rating: KeyworkerRating;
  keyworker_score: number | null;
  headline: string;
  coverage_profile: CoverageProfile;
  quality_profile: QualityProfile;
  engagement_profile: EngagementProfile;
  therapeutic_profile: TherapeuticProfile;
  follow_up_profile: FollowUpProfile;
  strengths: string[];
  concerns: string[];
  recommendations: KeyworkerRecommendation[];
  insights: KeyworkerInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): KeyworkerRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function avg(vals: number[]): number {
  return vals.length === 0 ? 0 : Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeKeyworker(
  input: HomeKeyworkerInput,
): HomeKeyworkerResult {
  const { today, total_children, lookback_days = 90 } = input;

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const sessions = input.sessions.filter(
    s => s.session_date >= cutoffStr && s.session_date <= today,
  );

  if (sessions.length === 0) {
    return {
      keyworker_rating: "insufficient_data",
      keyworker_score: 0,
      headline: "No keyworker sessions recorded — therapeutic oversight cannot be assessed.",
      coverage_profile: emptyCoverage(),
      quality_profile: emptyQuality(),
      engagement_profile: emptyEngagement(),
      therapeutic_profile: emptyTherapeutic(),
      follow_up_profile: emptyFollowUp(),
      strengths: [],
      concerns: ["No keyworker sessions recorded — every child should have regular, meaningful 1:1 time with their keyworker."],
      recommendations: [{ rank: 1, recommendation: "Establish a weekly keyworker session schedule for every child in the home.", urgency: "immediate", regulatory_ref: "Reg 44" }],
      insights: [{ text: "No keyworker sessions found within the review period. Keyworker sessions are a fundamental mechanism for building trusted relationships with children. Ofsted expects to see regular, recorded 1:1 sessions where children's views are sought and therapeutic progress is tracked.", severity: "critical" }],
    };
  }

  // ── Coverage Profile ───────────────────────────────────────────
  const childMap = new Map<string, number>();
  for (const s of sessions) {
    childMap.set(s.child_id, (childMap.get(s.child_id) ?? 0) + 1);
  }
  const childrenWithSessions = childMap.size;
  const coverageRate = total_children > 0 ? pct(childrenWithSessions, total_children) : (childrenWithSessions > 0 ? 100 : 0);
  const perChildCounts = [...childMap.values()];
  const avgPerChild = perChildCounts.length > 0
    ? Math.round((perChildCounts.reduce((s, v) => s + v, 0) / perChildCounts.length) * 10) / 10
    : null;
  const minPerChild = perChildCounts.length > 0 ? Math.min(...perChildCounts) : null;
  const maxPerChild = perChildCounts.length > 0 ? Math.max(...perChildCounts) : null;

  const coverageProfile: CoverageProfile = {
    total_sessions: sessions.length,
    children_with_sessions: childrenWithSessions,
    coverage_rate: coverageRate,
    avg_sessions_per_child: avgPerChild,
    min_sessions_per_child: minPerChild,
    max_sessions_per_child: maxPerChild,
  };

  // ── Quality Profile ────────────────────────────────────────────
  const avgDuration = avg(sessions.map(s => s.duration_minutes));
  const avgSatisfaction = avg(sessions.map(s => s.child_satisfaction));
  const avgThemes = avg(sessions.map(s => s.themes_count));
  const adequateDuration = sessions.filter(s => s.duration_minutes >= 20).length;
  const adequateDurationRate = pct(adequateDuration, sessions.length);

  const qualityProfile: QualityProfile = {
    avg_duration: avgDuration,
    avg_satisfaction: avgSatisfaction,
    avg_themes: avgThemes,
    adequate_duration_rate: adequateDurationRate,
  };

  // ── Engagement Profile ─────────────────────────────────────────
  const choseFormat = sessions.filter(s => s.child_chose_format).length;
  const childBroughtUp = sessions.filter(s => s.child_brought_up).length;
  const childActions = sessions.filter(s => s.agreed_actions_child_count > 0).length;

  const engagementProfile: EngagementProfile = {
    child_chose_format_rate: pct(choseFormat, sessions.length),
    child_brought_up_rate: pct(childBroughtUp, sessions.length),
    child_actions_rate: pct(childActions, sessions.length),
  };

  // ── Therapeutic Profile ────────────────────────────────────────
  const validMood = sessions.filter(s => s.mood_before > 0 && s.mood_after > 0);
  const avgMoodBefore = avg(validMood.map(s => s.mood_before));
  const avgMoodAfter = avg(validMood.map(s => s.mood_after));
  const improved = validMood.filter(s => s.mood_after > s.mood_before);
  const moodImprovementRate = pct(improved.length, validMood.length);

  const therapeuticProfile: TherapeuticProfile = {
    avg_mood_before: avgMoodBefore,
    avg_mood_after: avgMoodAfter,
    mood_improvement_rate: moodImprovementRate,
    sessions_with_improvement: improved.length,
  };

  // ── Follow-Up Profile ──────────────────────────────────────────
  const withFollowUp = sessions.filter(s => s.follow_up_date !== "");
  const followUpSetRate = pct(withFollowUp.length, sessions.length);
  const overdueFollowUps = withFollowUp.filter(s => s.follow_up_date < today).length;
  const flagsTotal = sessions.reduce((s, sess) => s + sess.flags_raised_count, 0);

  const followUpProfile: FollowUpProfile = {
    follow_up_set_rate: followUpSetRate,
    overdue_follow_ups: overdueFollowUps,
    flags_raised_total: flagsTotal,
  };

  // ── Scoring ───────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Coverage (±5)
  if (coverageRate >= 100) score += 5;
  else if (coverageRate >= 80) score += 3;
  else if (coverageRate >= 50) score += 1;
  else score -= 4;

  // 2. Session frequency per child (±4)
  if ((avgPerChild ?? 0) >= 4) score += 4;
  else if ((avgPerChild ?? 0) >= 2) score += 2;
  else if ((avgPerChild ?? 0) >= 1) score += 0;
  else score -= 3;

  // 3. Duration quality (±3)
  if (adequateDurationRate >= 90) score += 3;
  else if (adequateDurationRate >= 70) score += 1;
  else score -= 2;

  // 4. Child satisfaction (±4)
  if (avgSatisfaction >= 4.0) score += 4;
  else if (avgSatisfaction >= 3.0) score += 2;
  else if (avgSatisfaction >= 2.0) score += 0;
  else score -= 3;

  // 5. Mood improvement (±3)
  if (validMood.length > 0) {
    if (moodImprovementRate >= 70) score += 3;
    else if (moodImprovementRate >= 50) score += 1;
    else score -= 2;
  } else {
    score += 1; // No mood data recorded — not a penalty
  }

  // 6. Child format choice (±3)
  if ((engagementProfile.child_chose_format_rate ?? 0) >= 80) score += 3;
  else if ((engagementProfile.child_chose_format_rate ?? 0) >= 50) score += 1;
  else score -= 2;

  // 7. Follow-up currency (±3)
  if (withFollowUp.length > 0) {
    const overdueRate = pct(overdueFollowUps, withFollowUp.length);
    if (overdueRate <= 10) score += 3;
    else if (overdueRate <= 30) score += 1;
    else score -= 2;
  } else {
    score += 1; // No follow-ups set — not a penalty
  }

  // 8. Theme diversity (±3)
  if (avgThemes >= 3) score += 3;
  else if (avgThemes >= 2) score += 1;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: string[] = [];
  if (coverageRate >= 100) strengths.push("Every child in the home is receiving keyworker sessions — full coverage achieved.");
  if (avgSatisfaction >= 4.0) strengths.push(`Children report high satisfaction (${avgSatisfaction}/5) — sessions are meaningful to them.`);
  if (moodImprovementRate >= 70 && validMood.length > 0) strengths.push(`${moodImprovementRate}% of sessions show mood improvement — genuine therapeutic benefit.`);
  if ((engagementProfile.child_chose_format_rate ?? 0) >= 80) strengths.push(`Children choose session format ${(engagementProfile.child_chose_format_rate ?? 0)}% of the time — child-centred practice.`);
  if ((avgPerChild ?? 0) >= 4) strengths.push(`Average ${(avgPerChild ?? 0)} sessions per child — consistent, regular engagement.`);
  if (adequateDurationRate >= 90) strengths.push(`${adequateDurationRate}% of sessions are 20+ minutes — sufficient time for meaningful work.`);

  // ── Concerns ──────────────────────────────────────────────────
  const concerns: string[] = [];
  if (coverageRate < 50) concerns.push(`Only ${coverageRate}% of children have had keyworker sessions — some children are not being reached.`);
  if (avgSatisfaction < 3.0 && sessions.length > 0) concerns.push(`Average satisfaction is ${avgSatisfaction}/5 — children may not find sessions helpful.`);
  if (validMood.length > 0 && moodImprovementRate < 50) concerns.push(`Only ${moodImprovementRate}% of sessions show mood improvement — review therapeutic approach.`);
  if (adequateDurationRate < 70) concerns.push(`Only ${adequateDurationRate}% of sessions reach 20 minutes — sessions may be too brief for meaningful engagement.`);
  if ((engagementProfile.child_chose_format_rate ?? 0) < 50) concerns.push(`Children choose their session format only ${(engagementProfile.child_chose_format_rate ?? 0)}% of the time — sessions may feel imposed.`);
  if (withFollowUp.length > 0 && pct(overdueFollowUps, withFollowUp.length) > 30) concerns.push(`${overdueFollowUps} follow-up sessions are overdue — continuity of therapeutic support is at risk.`);

  // ── Recommendations ───────────────────────────────────────────
  const recs: KeyworkerRecommendation[] = [];
  let rank = 1;

  if (coverageRate < 50) {
    recs.push({ rank: rank++, recommendation: "Ensure every child has a named keyworker and receives at least weekly 1:1 sessions.", urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (avgSatisfaction < 3.0 && sessions.length > 0) {
    recs.push({ rank: rank++, recommendation: `Child satisfaction averages ${avgSatisfaction}/5 — review session content, format, and whether children feel heard.`, urgency: "soon", regulatory_ref: "Reg 44" });
  }
  if (adequateDurationRate < 70) {
    recs.push({ rank: rank++, recommendation: "Increase session duration — aim for at least 20 minutes to allow meaningful therapeutic engagement.", urgency: "soon", regulatory_ref: "Reg 44" });
  }
  if ((engagementProfile.child_chose_format_rate ?? 0) < 50) {
    recs.push({ rank: rank++, recommendation: "Offer children a choice of session format — this promotes agency and increases engagement.", urgency: "planned", regulatory_ref: "Reg 44" });
  }

  // ── Insights ──────────────────────────────────────────────────
  const insights: KeyworkerInsight[] = [];

  if (coverageRate >= 100 && avgSatisfaction >= 4.0 && moodImprovementRate >= 70) {
    insights.push({ text: `Keyworker practice is exemplary — every child receives sessions, satisfaction averages ${avgSatisfaction}/5, and ${moodImprovementRate}% of sessions show mood improvement. Ofsted will recognise a home where children have consistent, meaningful relationships with trusted adults who make a tangible difference to their wellbeing.`, severity: "positive" });
  }
  if (coverageRate < 50) {
    insights.push({ text: `Only ${coverageRate}% of children are receiving keyworker sessions. Ofsted expects to see every child building a trusted relationship with a named keyworker. Without this, children may not have a safe space to express their views, discuss worries, or process their experiences.`, severity: "critical" });
  }
  if (validMood.length > 0 && moodImprovementRate < 50) {
    insights.push({ text: `Only ${moodImprovementRate}% of sessions show mood improvement. When sessions don't help children feel better, it may indicate the approach needs reviewing — consider different formats, environments, or therapeutic techniques.`, severity: "warning" });
  }
  if (avgSatisfaction < 3.0 && sessions.length > 0) {
    insights.push({ text: `Average child satisfaction is ${avgSatisfaction}/5. Low satisfaction may indicate sessions feel like a chore rather than a support. Ask children what would make sessions more useful to them.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding keyworker practice — ${sessions.length} sessions, ${coverageRate}% coverage, ${avgSatisfaction}/5 satisfaction.`;
  } else if (rating === "good") {
    headline = "Good keyworker engagement — regular sessions with minor gaps in coverage or quality.";
  } else if (rating === "adequate") {
    headline = "Adequate keyworker practice — coverage, frequency, or session quality needs improvement.";
  } else {
    headline = "Keyworker practice is inadequate — children are not receiving sufficient therapeutic support.";
  }

  return {
    keyworker_rating: rating,
    keyworker_score: score,
    headline,
    coverage_profile: coverageProfile,
    quality_profile: qualityProfile,
    engagement_profile: engagementProfile,
    therapeutic_profile: therapeuticProfile,
    follow_up_profile: followUpProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyCoverage(): CoverageProfile {
  return { total_sessions: 0, children_with_sessions: 0, coverage_rate: 0, avg_sessions_per_child: 0, min_sessions_per_child: 0, max_sessions_per_child: 0 };
}

function emptyQuality(): QualityProfile {
  return { avg_duration: 0, avg_satisfaction: 0, avg_themes: 0, adequate_duration_rate: 0 };
}

function emptyEngagement(): EngagementProfile {
  return { child_chose_format_rate: 0, child_brought_up_rate: 0, child_actions_rate: 0 };
}

function emptyTherapeutic(): TherapeuticProfile {
  return { avg_mood_before: 0, avg_mood_after: 0, mood_improvement_rate: 0, sessions_with_improvement: 0 };
}

function emptyFollowUp(): FollowUpProfile {
  return { follow_up_set_rate: 0, overdue_follow_ups: 0, flags_raised_total: 0 };
}
