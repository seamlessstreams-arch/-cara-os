// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WELLBEING INTELLIGENCE ENGINE
// Home-level engine aggregating the emotional wellbeing of all children:
// mood trends, sleep quality, welfare check patterns, incident impact,
// activity engagement, and overall home "temperature."
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 6 (quality of care), Reg 7 (welfare),
// Reg 34 (welfare of children). SCCIF: "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildRef {
  id: string;
  name: string;
}

export interface MoodEntryInput {
  child_id: string;
  date: string;
  mood_score: number;       // 1-10
}

export interface SleepEntryInput {
  child_id: string;
  date: string;
  quality: string;          // good, fair, poor, disturbed
  disturbance_count: number;
}

export interface WelfareCheckEntryInput {
  child_id: string;
  date: string;
  outcome: string;          // ok, concern
}

export interface IncidentEntryInput {
  child_id: string;
  date: string;
  severity: string;
}

export interface ActivityEntryInput {
  child_id: string;
  date: string;
  participated: boolean;
}

export interface HomeWellbeingInput {
  today: string;
  children: ChildRef[];
  mood_entries: MoodEntryInput[];
  sleep_entries: SleepEntryInput[];
  welfare_checks: WelfareCheckEntryInput[];
  incidents: IncidentEntryInput[];
  activities: ActivityEntryInput[];
}

import { below, meanOf, meets, rateOf } from "@/lib/metrics/rate";

// ── Output Types ────────────────────────────────────────────────────────────

export type HomeTemperature = "thriving" | "positive" | "settled" | "unsettled" | "concerning";

export interface ChildWellbeingProfile {
  child_id: string;
  child_name: string;
  // Null throughout means nothing was recorded for that domain, not a zero result
  avg_mood_7d: number | null;
  avg_mood_30d: number | null;
  mood_trend: "improving" | "stable" | "declining" | "insufficient_data";
  sleep_quality_score: number | null;   // 0-100
  welfare_ok_rate: number | null;       // 0-100
  incident_count_30d: number;
  activity_participation_rate: number | null;
  wellbeing_score: number;              // 0-100
  flags: string[];
}

export interface HomeMoodSnapshot {
  average_mood_today: number | null;
  average_mood_7d: number | null;
  average_mood_30d: number | null;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface SleepOverview {
  good_rate: number | null;
  disturbed_rate: number | null;
  total_disturbances_7d: number;
  children_with_poor_sleep: string[];
}

export interface WellbeingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface WellbeingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface HomeWellbeingResult {
  generated_at: string;
  temperature: HomeTemperature;
  temperature_score: number;        // 0-100
  headline: string;
  mood_snapshot: HomeMoodSnapshot;
  sleep_overview: SleepOverview;
  child_profiles: ChildWellbeingProfile[];
  children_of_concern: string[];    // child names with low wellbeing
  strengths: string[];
  concerns: string[];
  recommendations: WellbeingRecommendation[];
  insights: WellbeingInsight[];
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

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function sleepScore(quality: string): number {
  switch (quality.toLowerCase()) {
    case "good":      return 100;
    case "fair":      return 65;
    case "poor":      return 30;
    case "disturbed": return 15;
    default:          return 50;
  }
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeHomeWellbeing(
  input: HomeWellbeingInput,
): HomeWellbeingResult {
  const { today, children, mood_entries, sleep_entries, welfare_checks, incidents, activities } = input;

  // ── Per-Child Profiles ───────────────────────────────────────────────
  const child_profiles: ChildWellbeingProfile[] = children.map((c) => {
    // Mood
    const moods7d = mood_entries.filter((m) => m.child_id === c.id && isWithin(today, m.date, 7)).map((m) => m.mood_score);
    const moods30d = mood_entries.filter((m) => m.child_id === c.id && isWithin(today, m.date, 30)).map((m) => m.mood_score);
    const moodsPrev = mood_entries.filter((m) => {
      const da = daysAgo(today, m.date);
      return m.child_id === c.id && da > 30 && da <= 60;
    }).map((m) => m.mood_score);

    const avg7d = avg(moods7d);
    const avg30d = avg(moods30d);
    const avgPrev = avg(moodsPrev);

    // A trend needs both windows measured — silence in either is not movement
    let moodTrend: ChildWellbeingProfile["mood_trend"];
    if (avg30d === null || avgPrev === null) {
      moodTrend = "insufficient_data";
    } else if (avg30d > avgPrev + 0.5) {
      moodTrend = "improving";
    } else if (avg30d < avgPrev - 0.5) {
      moodTrend = "declining";
    } else {
      moodTrend = "stable";
    }

    // Sleep
    const sleep7d = sleep_entries.filter((s) => s.child_id === c.id && isWithin(today, s.date, 7));
    const sleepScores = sleep7d.map((s) => sleepScore(s.quality));
    const sleepQual = meanOf(sleepScores);

    // Welfare checks
    const welf30d = welfare_checks.filter((w) => w.child_id === c.id && isWithin(today, w.date, 30));
    const welfOk = welf30d.filter((w) => w.outcome === "ok");
    const welfOkRate = rateOf(welfOk, welf30d);

    // Incidents
    const inc30d = incidents.filter((i) => i.child_id === c.id && isWithin(today, i.date, 30));

    // Activities
    const act30d = activities.filter((a) => a.child_id === c.id && isWithin(today, a.date, 30));
    const actParticipated = act30d.filter((a) => a.participated);
    const actRate = rateOf(actParticipated, act30d);

    // Composite wellbeing score (0-100)
    let ws = 50;
    if (avg30d !== null && avg30d >= 7) ws += 15;
    else if (avg30d !== null && avg30d >= 5) ws += 5;
    else if (avg30d !== null && avg30d < 4) ws -= 15;
    if (moodTrend === "improving") ws += 5;
    if (moodTrend === "declining") ws -= 10;
    if (meets(sleepQual, 80)) ws += 5;
    else if (below(sleepQual, 40)) ws -= 10;
    if (meets(welfOkRate, 100)) ws += 5;
    if (welf30d.filter((w) => w.outcome === "concern").length > 0) ws -= 5;
    if (inc30d.length === 0) ws += 5;
    if (inc30d.length >= 3) ws -= 5;
    if (inc30d.some((i) => i.severity === "critical")) ws -= 10;
    if (meets(actRate, 80) && act30d.length >= 2) ws += 5;
    else if (act30d.length === 0) ws -= 3;

    ws = clamp(ws, 0, 100);

    const flags: string[] = [];
    if (avg30d !== null && avg30d < 4) flags.push("Low mood (30d avg below 4)");
    if (moodTrend === "declining") flags.push("Mood declining");
    if (below(sleepQual, 40)) flags.push("Poor sleep quality");
    if (inc30d.length >= 3) flags.push(`${inc30d.length} incidents in 30d`);
    if (welf30d.filter((w) => w.outcome === "concern").length >= 2) flags.push("Multiple welfare concerns");

    return {
      child_id: c.id,
      child_name: c.name,
      avg_mood_7d: avg7d,
      avg_mood_30d: avg30d,
      mood_trend: moodTrend,
      sleep_quality_score: sleepQual,
      welfare_ok_rate: welfOkRate,
      incident_count_30d: inc30d.length,
      activity_participation_rate: actRate,
      wellbeing_score: ws,
      flags,
    };
  }).sort((a, b) => a.wellbeing_score - b.wellbeing_score); // Lowest first

  // ── Home Mood Snapshot ───────────────────────────────────────────────
  const allMoodsToday = mood_entries.filter((m) => m.date === today).map((m) => m.mood_score);
  const allMoods7d = mood_entries.filter((m) => isWithin(today, m.date, 7)).map((m) => m.mood_score);
  const allMoods30d = mood_entries.filter((m) => isWithin(today, m.date, 30)).map((m) => m.mood_score);
  const allMoodsPrev = mood_entries.filter((m) => {
    const da = daysAgo(today, m.date);
    return da > 30 && da <= 60;
  }).map((m) => m.mood_score);

  const avgAll30d = avg(allMoods30d);
  const avgAllPrev = avg(allMoodsPrev);
  const homeMoodTrend: HomeMoodSnapshot["trend"] =
    avgAll30d === null || avgAllPrev === null ? "insufficient_data" :
    avgAll30d > avgAllPrev + 0.3 ? "improving" :
    avgAll30d < avgAllPrev - 0.3 ? "declining" :
    "stable";

  const mood_snapshot: HomeMoodSnapshot = {
    average_mood_today: avg(allMoodsToday),
    average_mood_7d: avg(allMoods7d),
    average_mood_30d: avgAll30d,
    trend: homeMoodTrend,
  };

  // ── Sleep Overview ───────────────────────────────────────────────────
  const sleep7d = sleep_entries.filter((s) => isWithin(today, s.date, 7));
  const goodSleep = sleep7d.filter((s) => s.quality === "good");
  const disturbedSleep = sleep7d.filter((s) => s.quality === "disturbed" || s.quality === "poor");
  const totalDisturbances = sleep7d.reduce((s, e) => s + e.disturbance_count, 0);
  const childrenPoorSleep = [...new Set(
    sleep7d.filter((s) => s.quality === "poor" || s.quality === "disturbed")
      .map((s) => s.child_id),
  )];
  const poorSleepNames = childrenPoorSleep
    .map((id) => children.find((c) => c.id === id)?.name ?? id);

  const sleep_overview: SleepOverview = {
    good_rate: rateOf(goodSleep, sleep7d),
    disturbed_rate: rateOf(disturbedSleep, sleep7d),
    total_disturbances_7d: totalDisturbances,
    children_with_poor_sleep: poorSleepNames,
  };

  // ── Children of Concern ──────────────────────────────────────────────
  const children_of_concern = child_profiles
    .filter((p) => p.wellbeing_score < 40 || p.flags.length >= 2)
    .map((p) => p.child_name);

  // ── Composite Temperature Score ──────────────────────────────────────
  const avgWellbeing = avg(child_profiles.map((p) => p.wellbeing_score));

  let score = Math.round(avgWellbeing ?? 50);

  // Adjust for home-wide factors
  if (mood_snapshot.trend === "improving") score += 5;
  if (mood_snapshot.trend === "declining") score -= 5;
  if (sleep_overview.disturbed_rate !== null && sleep_overview.disturbed_rate > 30) score -= 5;
  if (children_of_concern.length > 0) score -= children_of_concern.length * 3;
  if (children_of_concern.length === 0 && children.length > 0) score += 3;

  score = clamp(score, 0, 100);

  const temperature: HomeTemperature =
    score >= 80 ? "thriving" :
    score >= 65 ? "positive" :
    score >= 50 ? "settled" :
    score >= 35 ? "unsettled" :
    "concerning";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Home wellbeing temperature: ${temperature}`);
  if (mood_snapshot.average_mood_7d !== null) parts.push(`avg mood ${mood_snapshot.average_mood_7d}/10 (7d)`);
  if (children_of_concern.length > 0) parts.push(`${children_of_concern.length} child${children_of_concern.length !== 1 ? "ren" : ""} of concern`);
  if (sleep_overview.children_with_poor_sleep.length > 0) parts.push(`${sleep_overview.children_with_poor_sleep.length} with sleep issues`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (temperature === "thriving" || temperature === "positive") {
    strengths.push(`Home wellbeing is ${temperature} (score: ${score}%). Children appear settled, engaged, and making progress. This evidences a nurturing care environment.`);
  }

  if (mood_snapshot.trend === "improving" && allMoods30d.length >= 5) {
    strengths.push("Home-wide mood trend is improving. The care environment is having a positive impact on children's emotional wellbeing.");
  }

  if (mood_snapshot.average_mood_7d !== null && mood_snapshot.average_mood_7d >= 7 && allMoods7d.length >= 3) {
    strengths.push(`Average mood across the home is ${mood_snapshot.average_mood_7d}/10 in the last 7 days. Children are experiencing a positive emotional environment.`);
  }

  if (meets(sleep_overview.good_rate, 80) && sleep7d.length >= 3) {
    strengths.push(`${sleep_overview.good_rate}% good sleep quality across the home. Effective bedtime routines and a calm night environment support children's wellbeing.`);
  }

  if (children_of_concern.length === 0 && children.length >= 2) {
    strengths.push("No children are flagged as being of concern. All children in the home appear to be experiencing adequate or better wellbeing.");
  }

  const highWellbeing = child_profiles.filter((p) => p.wellbeing_score >= 70);
  if (highWellbeing.length > 0) {
    strengths.push(`${highWellbeing.length} of ${children.length} child${children.length !== 1 ? "ren" : ""} have wellbeing scores of 70%+, indicating strong placement experiences.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (mood_snapshot.trend === "declining" && allMoods30d.length >= 3) {
    concerns.push("Home-wide mood trend is declining. This may indicate systemic issues — review care approach, staffing, and any environmental changes.");
  }

  if (mood_snapshot.average_mood_7d !== null && mood_snapshot.average_mood_7d < 5 && allMoods7d.length >= 3) {
    concerns.push(`Average home mood is ${mood_snapshot.average_mood_7d}/10 this week. Low collective mood warrants investigation — consider a team debrief and individual check-ins with each child.`);
  }

  if (children_of_concern.length > 0) {
    concerns.push(`${children_of_concern.length} child${children_of_concern.length !== 1 ? "ren" : ""} of concern: ${children_of_concern.join(", ")}. Individual wellbeing plans should be reviewed and enhanced.`);
  }

  if (sleep_overview.disturbed_rate !== null && sleep_overview.disturbed_rate > 30 && sleep7d.length >= 3) {
    concerns.push(`${sleep_overview.disturbed_rate}% disturbed sleep rate across the home. Poor sleep impacts emotional regulation, education, and behaviour. Review night-time routines and environment.`);
  }

  if (sleep_overview.children_with_poor_sleep.length > 0) {
    concerns.push(`Children with poor sleep: ${sleep_overview.children_with_poor_sleep.join(", ")}. Consider individual sleep assessments and targeted interventions.`);
  }

  const decliningChildren = child_profiles.filter((p) => p.mood_trend === "declining");
  if (decliningChildren.length >= 2) {
    concerns.push(`${decliningChildren.length} children have declining mood trends. When multiple children are affected, consider whether there are systemic factors at play (staffing changes, peer dynamics, environmental issues).`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: WellbeingRecommendation[] = [];
  let rank = 0;

  if (children_of_concern.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Conduct individual wellbeing reviews for ${children_of_concern.join(", ")}. Explore what is driving low wellbeing and adjust care plans accordingly.`,
      urgency: "soon",
      domain: "wellbeing",
      regulatory_ref: "Reg 7",
    });
  }

  if (mood_snapshot.trend === "declining" && mood_snapshot.average_mood_30d !== null && mood_snapshot.average_mood_30d < 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Hold a team meeting to review the emotional climate of the home. Identify contributing factors and develop an action plan to improve children's wellbeing.",
      urgency: "immediate",
      domain: "leadership",
      regulatory_ref: "Reg 6",
    });
  }

  if (sleep_overview.disturbed_rate !== null && sleep_overview.disturbed_rate > 30 && sleep7d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review night-time routines and environment. Consider: screen time before bed, room temperature, noise levels, and individual wind-down plans for each child.",
      urgency: "soon",
      domain: "sleep",
      regulatory_ref: "Reg 34",
    });
  }

  if (decliningChildren.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate systemic factors affecting multiple children. Review recent changes (staffing, routines, peer dynamics, events) and address root causes rather than individual symptoms.",
      urgency: "soon",
      domain: "systemic",
      regulatory_ref: "Reg 6",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: WellbeingInsight[] = [];

  if (temperature === "concerning") {
    insights.push({
      severity: "critical",
      text: `Home wellbeing temperature is concerning (${score}%). Multiple children are showing signs of poor wellbeing. Ofsted inspectors would expect to see this identified and action being taken. The emotional climate of the home is a key indicator of care quality.`,
    });
  }

  if (decliningChildren.length >= 2 && mood_snapshot.trend === "declining") {
    insights.push({
      severity: "critical",
      text: "Multiple children have declining mood trends and the home-wide trend is also declining. This pattern suggests systemic rather than individual issues — it may reflect staffing changes, environmental factors, or unresolved group dynamics.",
    });
  }

  if (temperature === "thriving") {
    insights.push({
      severity: "positive",
      text: `Home wellbeing is thriving (${score}%). Children are settled, their mood is positive, sleep is good, and engagement is high. This is exactly what outstanding care looks like — a home where children feel safe, valued, and happy.`,
    });
  }

  if (mood_snapshot.trend === "improving" && meets(sleep_overview.good_rate, 70) && children_of_concern.length === 0) {
    insights.push({
      severity: "positive",
      text: "Improving mood trend, good sleep quality, and no children of concern. The home is providing a stable, nurturing environment. Inspectors would see this as strong evidence of effective care practice.",
    });
  }

  if (child_profiles.every((p) => p.wellbeing_score >= 50) && children.length >= 2) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have wellbeing scores of 50%+. While there may be individual areas to improve, no child is falling below the threshold of concern — this demonstrates consistent baseline care across the home.`,
    });
  }

  return {
    generated_at: today,
    temperature,
    temperature_score: score,
    headline,
    mood_snapshot,
    sleep_overview,
    child_profiles,
    children_of_concern,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
