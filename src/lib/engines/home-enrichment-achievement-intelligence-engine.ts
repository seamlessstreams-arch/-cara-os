// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ENRICHMENT & ACHIEVEMENT INTELLIGENCE ENGINE
// Home-level: aggregates creative projects, extracurricular clubs,
// positive achievements, club records, and sanctions/rewards.
// CHR 2015 Reg 9: Enjoyment and achievement.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface CreativeProjectInput {
  id: string;
  child_id: string;
  status: string; // "idea" | "in_progress" | "paused" | "completed" | "exhibited"
  skills_growing_count: number;
  child_voice_provided: boolean;
  review_date: string;
  external_showcase_present: boolean;
  contests_entered_count: number;
}

export interface ExtracurricularClubInput {
  id: string;
  child_id: string;
  ongoing: boolean;
  child_initiated: boolean;
  attendance_rate: number; // 0-100
  skills_built_count: number;
  child_voice_provided: boolean;
  review_date: string;
}

export interface PositiveAchievementInput {
  id: string;
  child_id: string;
  date: string;
  shared_with_count: number;
  celebrated_how_provided: boolean;
}

export interface ClubRecordInput {
  id: string;
  child_id: string;
  ongoing_status: string; // "active" | "paused" | "ended"
  child_enjoyment_rating: number; // 1-5
  achievements_count: number;
  child_comments_provided: boolean;
  reviewed_date: string;
}

export interface SanctionRewardInput {
  id: string;
  child_id: string;
  date: string;
  direction: string; // "reward" | "sanction"
  proportionate: boolean;
  child_response_provided: boolean;
}

export interface HomeEnrichmentAchievementInput {
  today: string;
  creative_projects: CreativeProjectInput[];
  extracurricular_clubs: ExtracurricularClubInput[];
  positive_achievements: PositiveAchievementInput[];
  club_records: ClubRecordInput[];
  sanction_rewards: SanctionRewardInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type EnrichmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CreativeProjectProfile {
  total_projects: number;
  child_coverage: number;
  active_rate: number;
  showcase_count: number;
}

export interface ClubProfile {
  total_clubs: number;
  child_coverage: number;
  avg_attendance: number;
  child_initiated_rate: number;
}

export interface AchievementProfile {
  total_achievements_90d: number;
  child_coverage: number;
  celebration_rate: number;
}

export interface RewardSanctionProfile {
  total_90d: number;
  reward_ratio: number;
  proportionate_rate: number;
}

export interface HomeEnrichmentAchievementResult {
  enrichment_rating: EnrichmentRating;
  enrichment_score: number;
  headline: string;
  creative_projects: CreativeProjectProfile;
  clubs: ClubProfile;
  achievements: AchievementProfile;
  reward_sanctions: RewardSanctionProfile;
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

export function computeHomeEnrichmentAchievement(
  input: HomeEnrichmentAchievementInput,
): HomeEnrichmentAchievementResult {
  const {
    today, creative_projects, extracurricular_clubs,
    positive_achievements, club_records, sanction_rewards,
    total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    creative_projects.length === 0 &&
    extracurricular_clubs.length === 0 &&
    positive_achievements.length === 0 &&
    club_records.length === 0 &&
    sanction_rewards.length === 0
  ) {
    return {
      enrichment_rating: "insufficient_data",
      enrichment_score: 0,
      headline: "No enrichment or achievement data available for analysis.",
      creative_projects: { total_projects: 0, child_coverage: 0, active_rate: 0, showcase_count: 0 },
      clubs: { total_clubs: 0, child_coverage: 0, avg_attendance: 0, child_initiated_rate: 0 },
      achievements: { total_achievements_90d: 0, child_coverage: 0, celebration_rate: 0 },
      reward_sanctions: { total_90d: 0, reward_ratio: 0, proportionate_rate: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Creative Projects analysis ───────────────────────────────────────
  const cpChildIds = new Set(creative_projects.map(p => p.child_id));
  const cpCoverage = pct(cpChildIds.size, total_children);
  const cpActive = creative_projects.filter(p => p.status === "in_progress" || p.status === "completed" || p.status === "exhibited");
  const cpActiveRate = pct(cpActive.length, creative_projects.length);
  const cpShowcase = creative_projects.filter(p => p.external_showcase_present).length;
  const cpOverdue = creative_projects.filter(p => daysBetween(p.review_date, today) > 0).length;

  const creative_projects_profile: CreativeProjectProfile = {
    total_projects: creative_projects.length,
    child_coverage: cpCoverage,
    active_rate: cpActiveRate,
    showcase_count: cpShowcase,
  };

  // ── Club analysis (combining both club types) ────────────────────────
  const ecChildIds = new Set(extracurricular_clubs.map(c => c.child_id));
  const crChildIds = new Set(club_records.map(c => c.child_id));
  const allClubChildIds = new Set([...ecChildIds, ...crChildIds]);
  const clubCoverage = pct(allClubChildIds.size, total_children);

  const ecOngoing = extracurricular_clubs.filter(c => c.ongoing);
  const ecAvgAttendance = ecOngoing.length > 0
    ? Math.round(ecOngoing.reduce((s, c) => s + c.attendance_rate, 0) / ecOngoing.length)
    : 0;

  const crActive = club_records.filter(c => c.ongoing_status === "active");
  const crAvgEnjoyment = crActive.length > 0
    ? Math.round((crActive.reduce((s, c) => s + c.child_enjoyment_rating, 0) / crActive.length) * 10) / 10
    : 0;

  const ecInitiatedRate = pct(
    extracurricular_clubs.filter(c => c.child_initiated).length,
    extracurricular_clubs.length,
  );

  const clubs_profile: ClubProfile = {
    total_clubs: extracurricular_clubs.length + club_records.length,
    child_coverage: clubCoverage,
    avg_attendance: ecAvgAttendance,
    child_initiated_rate: ecInitiatedRate,
  };

  // ── Achievement analysis (last 90 days) ──────────────────────────────
  const ach90 = positive_achievements.filter(a => {
    const d = daysBetween(a.date, today);
    return d >= 0 && d <= 90;
  });
  const achChildIds = new Set(ach90.map(a => a.child_id));
  const achCoverage = pct(achChildIds.size, total_children);
  const achCelebrated = ach90.filter(a => a.celebrated_how_provided);
  const achCelebrationRate = pct(achCelebrated.length, ach90.length);

  const achievements_profile: AchievementProfile = {
    total_achievements_90d: ach90.length,
    child_coverage: achCoverage,
    celebration_rate: achCelebrationRate,
  };

  // ── Sanction/Reward analysis (last 90 days) ──────────────────────────
  const sr90 = sanction_rewards.filter(sr => {
    const d = daysBetween(sr.date, today);
    return d >= 0 && d <= 90;
  });
  const srRewards = sr90.filter(sr => sr.direction === "reward");
  const srRewardRatio = pct(srRewards.length, sr90.length);
  const srProportionateRate = pct(sr90.filter(sr => sr.proportionate).length, sr90.length);

  const reward_sanctions_profile: RewardSanctionProfile = {
    total_90d: sr90.length,
    reward_ratio: srRewardRatio,
    proportionate_rate: srProportionateRate,
  };

  // ── Modifier 1: Creative Project Engagement (±5) ─────────────────────
  let mod1 = 0;
  if (creative_projects.length > 0) {
    if (cpCoverage >= 80 && cpActiveRate >= 70) mod1 += 3;
    else if (cpCoverage >= 50 && cpActiveRate >= 50) mod1 += 1;
    else if (cpCoverage < 30) mod1 -= 3;
    // Showcase bonus
    if (cpShowcase >= 2) mod1 += 2;
    else if (cpShowcase >= 1) mod1 += 1;
  } else if (total_children > 0) {
    mod1 = -2; // No creative projects at all
  }
  mod1 = Math.max(-5, Math.min(5, mod1));

  // ── Modifier 2: Club & Extracurricular Engagement (±4) ──────────────
  let mod2 = 0;
  if (extracurricular_clubs.length + club_records.length > 0) {
    if (clubCoverage >= 80 && ecAvgAttendance >= 80) mod2 += 3;
    else if (clubCoverage >= 60 && ecAvgAttendance >= 60) mod2 += 1;
    else if (clubCoverage < 30) mod2 -= 2;
    // Child-initiated bonus
    if (ecInitiatedRate >= 60) mod2 += 1;
  } else if (total_children > 0) {
    mod2 = -2;
  }
  mod2 = Math.max(-4, Math.min(4, mod2));

  // ── Modifier 3: Achievement Recognition (±4) ────────────────────────
  let mod3 = 0;
  if (ach90.length > 0) {
    if (achCoverage >= 80 && achCelebrationRate >= 80) mod3 += 3;
    else if (achCoverage >= 50 && achCelebrationRate >= 60) mod3 += 1;
    else if (achCoverage < 30) mod3 -= 2;
    // Volume bonus — are achievements being regularly recorded?
    const achPerChild = total_children > 0 ? ach90.length / total_children : 0;
    if (achPerChild >= 2) mod3 += 1;
  } else if (total_children > 0) {
    mod3 = -2;
  }
  mod3 = Math.max(-4, Math.min(4, mod3));

  // ── Modifier 4: Reward/Sanction Balance (±3) ────────────────────────
  let mod4 = 0;
  if (sr90.length > 0) {
    if (srRewardRatio >= 70 && srProportionateRate >= 90) mod4 += 3;
    else if (srRewardRatio >= 50 && srProportionateRate >= 70) mod4 += 1;
    else if (srRewardRatio < 30) mod4 -= 2;
    else if (srProportionateRate < 50) mod4 -= 1;
  }
  // Neutral when no sanctions/rewards — not all homes use formal systems
  mod4 = Math.max(-3, Math.min(3, mod4));

  // ── Modifier 5: Child Voice Across Enrichment (±3) ──────────────────
  let voiceCount = 0;
  let voiceTotal = 0;
  creative_projects.forEach(p => { voiceTotal++; if (p.child_voice_provided) voiceCount++; });
  extracurricular_clubs.forEach(c => { voiceTotal++; if (c.child_voice_provided) voiceCount++; });
  club_records.forEach(c => { voiceTotal++; if (c.child_comments_provided) voiceCount++; });
  sanction_rewards.forEach(sr => { voiceTotal++; if (sr.child_response_provided) voiceCount++; });
  const voiceRate = pct(voiceCount, voiceTotal);

  let mod5 = 0;
  if (voiceTotal > 0) {
    if (voiceRate >= 80) mod5 = 3;
    else if (voiceRate >= 60) mod5 = 2;
    else if (voiceRate >= 40) mod5 = 1;
    else if (voiceRate < 20) mod5 = -2;
  }
  mod5 = Math.max(-3, Math.min(3, mod5));

  // ── Modifier 6: Review Compliance (±3) ──────────────────────────────
  let overdueCount = cpOverdue;
  overdueCount += extracurricular_clubs.filter(c => daysBetween(c.review_date, today) > 0).length;
  overdueCount += club_records.filter(c => daysBetween(c.reviewed_date, today) > 0).length;
  const totalReviewable = creative_projects.length + extracurricular_clubs.length + club_records.length;
  const overdueRate = pct(overdueCount, totalReviewable);

  let mod6 = 0;
  if (totalReviewable > 0) {
    if (overdueRate === 0) mod6 = 3;
    else if (overdueRate <= 10) mod6 = 2;
    else if (overdueRate <= 25) mod6 = 1;
    else if (overdueRate > 50) mod6 = -3;
    else if (overdueRate > 30) mod6 = -1;
  }
  mod6 = Math.max(-3, Math.min(3, mod6));

  // ── Modifier 7: Skill Breadth & Enjoyment (±3) ──────────────────────
  let mod7 = 0;
  const totalSkillsGrowing = creative_projects.reduce((s, p) => s + p.skills_growing_count, 0);
  const totalSkillsBuilt = extracurricular_clubs.reduce((s, c) => s + c.skills_built_count, 0);
  const avgSkills = (creative_projects.length + extracurricular_clubs.length) > 0
    ? (totalSkillsGrowing + totalSkillsBuilt) / (creative_projects.length + extracurricular_clubs.length)
    : 0;

  if (avgSkills >= 3 && crAvgEnjoyment >= 4) mod7 = 3;
  else if (avgSkills >= 2 && crAvgEnjoyment >= 3) mod7 = 2;
  else if (avgSkills >= 1) mod7 = 1;
  else if (creative_projects.length + extracurricular_clubs.length > 0 && avgSkills < 1) mod7 = -1;
  mod7 = Math.max(-3, Math.min(3, mod7));

  // ── Modifier 8: Achievement Sharing & Community (±3) ─────────────────
  let mod8 = 0;
  const sharedAch = ach90.filter(a => a.shared_with_count >= 2);
  const sharedRate = pct(sharedAch.length, ach90.length);
  const contestsEntered = creative_projects.reduce((s, p) => s + p.contests_entered_count, 0);

  if (sharedRate >= 70 && contestsEntered >= 2) mod8 = 3;
  else if (sharedRate >= 50 || contestsEntered >= 1) mod8 = 2;
  else if (sharedRate >= 30) mod8 = 1;
  else if (ach90.length > 0 && sharedRate < 10) mod8 = -1;
  mod8 = Math.max(-3, Math.min(3, mod8));

  // ── Score ────────────────────────────────────────────────────────────
  const raw = 52 + mod1 + mod2 + mod3 + mod4 + mod5 + mod6 + mod7 + mod8;
  const enrichment_score = Math.max(0, Math.min(100, raw));

  const enrichment_rating: EnrichmentRating =
    enrichment_score >= 80 ? "outstanding" :
    enrichment_score >= 65 ? "good" :
    enrichment_score >= 45 ? "adequate" :
    "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (cpCoverage >= 80) strengths.push(`Strong creative engagement — ${cpCoverage}% of children have active projects.`);
  if (clubCoverage >= 80) strengths.push(`Excellent club participation — ${clubCoverage}% of children involved in clubs.`);
  if (achCelebrationRate >= 80 && ach90.length > 0) strengths.push(`Achievements are consistently celebrated (${achCelebrationRate}% celebration rate).`);
  if (srRewardRatio >= 70 && sr90.length > 0) strengths.push(`Positive reward culture — ${srRewardRatio}% reward-to-sanction ratio.`);
  if (voiceRate >= 80) strengths.push(`Strong child voice across enrichment activities (${voiceRate}%).`);
  if (cpShowcase >= 2) strengths.push(`${cpShowcase} creative projects showcased externally — real-world recognition.`);
  if (ecInitiatedRate >= 60) strengths.push(`${ecInitiatedRate}% of extracurricular activities are child-initiated.`);

  // ── Concerns ─────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (cpCoverage < 30 && total_children > 0) concerns.push(`Low creative project coverage — only ${cpCoverage}% of children have projects.`);
  if (clubCoverage < 30 && total_children > 0) concerns.push(`Low club participation — only ${clubCoverage}% of children in clubs.`);
  if (achCoverage < 30 && total_children > 0) concerns.push(`Achievements not being recorded for most children — only ${achCoverage}% coverage.`);
  if (srRewardRatio < 30 && sr90.length > 0) concerns.push(`Sanction-heavy approach — only ${srRewardRatio}% rewards vs sanctions.`);
  if (voiceRate < 20 && voiceTotal > 0) concerns.push(`Very low child voice across enrichment — only ${voiceRate}%.`);
  if (overdueRate > 50) concerns.push(`${overdueCount} overdue reviews across enrichment records.`);
  if (srProportionateRate < 50 && sr90.length > 0) concerns.push(`Only ${srProportionateRate}% of sanctions rated as proportionate.`);

  // ── Recommendations ──────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (cpCoverage < 50 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Expand creative project opportunities to ensure every child has access to arts and crafts.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (clubCoverage < 50 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase extracurricular club access — identify child interests and explore local opportunities.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (srRewardRatio < 50 && sr90.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review sanctions approach — consider more reward-based strategies to promote positive behaviour.", urgency: "immediate", regulatory_ref: "Reg 9" });
  }
  if (overdueRate > 30) {
    recommendations.push({ rank: ++rank, recommendation: "Bring enrichment reviews up to date to maintain oversight of each child's engagement.", urgency: "soon", regulatory_ref: null });
  }
  if (voiceRate < 40 && voiceTotal > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen child voice capture across creative, club, and reward records.", urgency: "planned", regulatory_ref: "Reg 7" });
  }

  // ── Insights ─────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (enrichment_score >= 80) {
    insights.push({ text: "Enrichment provision is outstanding — children have diverse opportunities and their achievements are celebrated consistently.", severity: "positive" });
  }
  if (ach90.length > 0 && achCelebrationRate < 50) {
    insights.push({ text: `Only ${achCelebrationRate}% of recent achievements were celebrated. LAC children benefit from consistent recognition and celebration.`, severity: "warning" });
  }
  if (creative_projects.length > 0 && cpActiveRate < 30) {
    insights.push({ text: `Only ${cpActiveRate}% of creative projects are active. Consider reinvigorating stalled projects or starting fresh ones.`, severity: "warning" });
  }
  if (sr90.length > 0 && srRewardRatio < 30) {
    insights.push({ text: "Sanctions significantly outweigh rewards. Trauma-informed practice suggests a minimum 4:1 positive-to-corrective ratio.", severity: "critical" });
  }
  if (ecAvgAttendance >= 85) {
    insights.push({ text: `Excellent club attendance at ${ecAvgAttendance}% — children are consistently engaging with community activities.`, severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (enrichment_rating === "outstanding") {
    headline = "Enrichment and achievement provision is outstanding — diverse opportunities, strong participation, and consistent celebration.";
  } else if (enrichment_rating === "good") {
    headline = "Good enrichment provision with solid participation. Some areas could be strengthened.";
  } else if (enrichment_rating === "adequate") {
    headline = "Adequate enrichment provision — children have some opportunities but coverage and engagement need improvement.";
  } else {
    headline = "Enrichment provision needs immediate attention — limited opportunities and low participation rates.";
  }

  return {
    enrichment_rating,
    enrichment_score,
    headline,
    creative_projects: creative_projects_profile,
    clubs: clubs_profile,
    achievements: achievements_profile,
    reward_sanctions: reward_sanctions_profile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
