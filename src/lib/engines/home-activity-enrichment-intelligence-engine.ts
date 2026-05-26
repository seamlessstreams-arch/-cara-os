// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ACTIVITY & ENRICHMENT INTELLIGENCE ENGINE
// Home-level engine aggregating activity provision, participation rates,
// variety of experiences, new experiences, and enrichment quality across
// all children. Surfaces whether the home is providing a rich, varied,
// and engaging programme of activities.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 9 (enjoyment & achievement), Reg 6 (quality).
// SCCIF: "Children enjoy a range of activities and experiences."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildRef {
  id: string;
  name: string;
}

export type ActivityCategory =
  | "sport" | "creative" | "outdoor" | "educational" | "social"
  | "life_skills" | "cultural" | "therapeutic" | "community" | "digital";

export type EngagementLevel = "enthusiastic" | "willing" | "reluctant" | "refused" | "suggested_by_yp";

export interface ActivityEntryInput {
  id: string;
  child_id: string;
  date: string;
  category: string;
  title: string;
  duration_minutes: number;
  engagement: string;
  is_new_experience: boolean;
  yp_feedback: string | null;
  staff_id: string;
}

export interface HomeActivityEnrichmentInput {
  today: string;
  children: ChildRef[];
  activities: ActivityEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EnrichmentRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface ChildActivityProfile {
  child_id: string;
  child_name: string;
  activities_30d: number;
  new_experiences_30d: number;
  categories_accessed: string[];
  participation_rate: number;    // % of activities where engaged (not refused)
  enthusiasm_rate: number;       // % enthusiastic or suggested_by_yp
  has_feedback: boolean;
  activity_score: number;        // 0-100
  flags: string[];
}

export interface ProvisionSnapshot {
  total_activities_30d: number;
  total_activities_7d: number;
  unique_categories_30d: number;
  avg_per_child_30d: number;
  new_experiences_30d: number;
  yp_suggested_30d: number;
  avg_duration_minutes: number;
  unique_staff_leading: number;
}

export interface EnrichmentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface EnrichmentInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface HomeActivityEnrichmentResult {
  generated_at: string;
  enrichment_rating: EnrichmentRating;
  enrichment_score: number;       // 0-100
  headline: string;
  provision: ProvisionSnapshot;
  category_breakdown: CategoryBreakdown[];
  child_profiles: ChildActivityProfile[];
  children_without_activities: string[];   // child names
  strengths: string[];
  concerns: string[];
  recommendations: EnrichmentRecommendation[];
  insights: EnrichmentInsight[];
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
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function avg(values: number[]): number {
  return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
}

function isEngaged(engagement: string): boolean {
  return engagement !== "refused";
}

function isEnthusiastic(engagement: string): boolean {
  return engagement === "enthusiastic" || engagement === "suggested_by_yp";
}

// All known activity categories for variety calculation
const ALL_CATEGORIES: ActivityCategory[] = [
  "sport", "creative", "outdoor", "educational", "social",
  "life_skills", "cultural", "therapeutic", "community", "digital",
];

// ── Main Computation ────────────────────────────────────────────────────────

export function computeHomeActivityEnrichment(
  input: HomeActivityEnrichmentInput,
): HomeActivityEnrichmentResult {
  const { today, children, activities } = input;

  const act30d = activities.filter((a) => isWithin(today, a.date, 30));
  const act7d = activities.filter((a) => isWithin(today, a.date, 7));

  // ── Per-Child Profiles ───────────────────────────────────────────────
  const child_profiles: ChildActivityProfile[] = children.map((c) => {
    const mine30d = act30d.filter((a) => a.child_id === c.id);
    const engaged = mine30d.filter((a) => isEngaged(a.engagement));
    const enthusiastic = mine30d.filter((a) => isEnthusiastic(a.engagement));
    const newExp = mine30d.filter((a) => a.is_new_experience);
    const categories = [...new Set(mine30d.map((a) => a.category))];
    const hasFeedback = mine30d.some((a) => a.yp_feedback && a.yp_feedback.trim().length > 0);

    const participationRate = pct(engaged.length, mine30d.length);
    const enthusiasmRate = pct(enthusiastic.length, mine30d.length);

    // Activity score
    let score = 50;
    if (mine30d.length >= 8) score += 15;
    else if (mine30d.length >= 4) score += 8;
    else if (mine30d.length >= 2) score += 3;
    else if (mine30d.length === 0) score -= 20;

    if (categories.length >= 5) score += 10;
    else if (categories.length >= 3) score += 5;
    else if (categories.length <= 1 && mine30d.length > 0) score -= 5;

    if (newExp.length >= 3) score += 8;
    else if (newExp.length >= 1) score += 3;

    if (enthusiasmRate >= 70) score += 5;
    if (participationRate < 50 && mine30d.length >= 2) score -= 10;

    if (hasFeedback) score += 3;

    score = clamp(score, 0, 100);

    const flags: string[] = [];
    if (mine30d.length === 0) flags.push("No activities in 30 days");
    if (mine30d.length > 0 && mine30d.length < 2) flags.push("Very few activities");
    if (categories.length <= 1 && mine30d.length >= 2) flags.push("Limited variety");
    if (participationRate < 50 && mine30d.length >= 2) flags.push("Low participation");
    if (mine30d.filter((a) => a.engagement === "refused").length >= 3) flags.push("Frequently refusing");

    return {
      child_id: c.id,
      child_name: c.name,
      activities_30d: mine30d.length,
      new_experiences_30d: newExp.length,
      categories_accessed: categories,
      participation_rate: participationRate,
      enthusiasm_rate: enthusiasmRate,
      has_feedback: hasFeedback,
      activity_score: score,
      flags,
    };
  }).sort((a, b) => a.activity_score - b.activity_score);

  // ── Provision Snapshot ───────────────────────────────────────────────
  const uniqueCats30d = [...new Set(act30d.map((a) => a.category))];
  const ypSuggested = act30d.filter((a) => a.engagement === "suggested_by_yp");
  const newExp30d = act30d.filter((a) => a.is_new_experience);
  const durations = act30d.filter((a) => a.duration_minutes > 0).map((a) => a.duration_minutes);
  const uniqueStaff = [...new Set(act30d.map((a) => a.staff_id).filter(Boolean))];

  const provision: ProvisionSnapshot = {
    total_activities_30d: act30d.length,
    total_activities_7d: act7d.length,
    unique_categories_30d: uniqueCats30d.length,
    avg_per_child_30d: children.length > 0 ? Math.round((act30d.length / children.length) * 10) / 10 : 0,
    new_experiences_30d: newExp30d.length,
    yp_suggested_30d: ypSuggested.length,
    avg_duration_minutes: Math.round(avg(durations)),
    unique_staff_leading: uniqueStaff.length,
  };

  // ── Category Breakdown ───────────────────────────────────────────────
  const catCounts = new Map<string, number>();
  for (const a of act30d) {
    catCounts.set(a.category, (catCounts.get(a.category) ?? 0) + 1);
  }
  const category_breakdown: CategoryBreakdown[] = [...catCounts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percentage: pct(count, act30d.length),
    }))
    .sort((a, b) => b.count - a.count);

  // ── Children Without Activities ──────────────────────────────────────
  const children_without_activities = child_profiles
    .filter((p) => p.activities_30d === 0)
    .map((p) => p.child_name);

  // ── Enrichment Score ─────────────────────────────────────────────────
  const avgChildScore = child_profiles.length > 0
    ? avg(child_profiles.map((p) => p.activity_score))
    : 50;

  let enrichment_score = Math.round(avgChildScore);

  // Adjust for home-wide factors
  if (uniqueCats30d.length >= 6) enrichment_score += 5;
  else if (uniqueCats30d.length <= 2 && act30d.length > 0) enrichment_score -= 5;

  if (ypSuggested.length >= 2) enrichment_score += 3;
  if (newExp30d.length >= children.length && children.length > 0) enrichment_score += 3;
  if (children_without_activities.length > 0) enrichment_score -= children_without_activities.length * 3;
  if (children_without_activities.length === 0 && children.length > 0) enrichment_score += 3;

  if (act30d.length === 0 && children.length > 0) enrichment_score -= 10;

  enrichment_score = clamp(enrichment_score, 0, 100);

  const enrichment_rating: EnrichmentRating =
    children.length === 0 || (act30d.length === 0 && children.length > 0) ? "insufficient_data" :
    enrichment_score >= 80 ? "outstanding" :
    enrichment_score >= 65 ? "good" :
    enrichment_score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Activity enrichment: ${enrichment_rating}`);
  if (provision.total_activities_30d > 0) parts.push(`${provision.total_activities_30d} activities (30d)`);
  if (uniqueCats30d.length > 0) parts.push(`${uniqueCats30d.length} categories`);
  if (children_without_activities.length > 0) parts.push(`${children_without_activities.length} child${children_without_activities.length !== 1 ? "ren" : ""} without activities`);
  if (newExp30d.length > 0) parts.push(`${newExp30d.length} new experience${newExp30d.length !== 1 ? "s" : ""}`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (enrichment_rating === "outstanding" || enrichment_rating === "good") {
    strengths.push(`Activity programme rated ${enrichment_rating} (${enrichment_score}%). Children are accessing a varied and engaging range of activities and experiences. This evidences good Reg 9 compliance.`);
  }

  if (uniqueCats30d.length >= 6) {
    strengths.push(`Activities span ${uniqueCats30d.length} different categories, providing a rich and varied programme. Inspectors look for breadth of experience — this demonstrates strong provision.`);
  }

  if (ypSuggested.length >= 2) {
    strengths.push(`${ypSuggested.length} activities were suggested by young people. Giving children agency over their activities demonstrates person-centred care and respect for the child's voice.`);
  }

  if (newExp30d.length >= 3) {
    strengths.push(`${newExp30d.length} new experiences introduced in the last 30 days. Expanding children's horizons with new activities promotes growth, resilience, and aspirational thinking.`);
  }

  if (children_without_activities.length === 0 && children.length >= 2) {
    strengths.push("Every child has participated in at least one activity in the last 30 days. Inclusive activity planning ensures no child is left behind.");
  }

  const highEngagement = child_profiles.filter((p) => p.enthusiasm_rate >= 70 && p.activities_30d >= 2);
  if (highEngagement.length > 0) {
    strengths.push(`${highEngagement.length} child${highEngagement.length !== 1 ? "ren" : ""} show high enthusiasm for activities. Strong engagement indicates activities are well-matched to children's interests.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (act30d.length === 0 && children.length > 0) {
    concerns.push("No activities recorded in the last 30 days. CHR 2015 Reg 9 requires the home to provide activities that are appropriate to each child's needs and preferences. This is a significant gap.");
  }

  if (children_without_activities.length > 0) {
    concerns.push(`${children_without_activities.length} child${children_without_activities.length !== 1 ? "ren" : ""} have no recorded activities: ${children_without_activities.join(", ")}. Every child should have access to a varied programme of activities.`);
  }

  if (uniqueCats30d.length <= 2 && act30d.length >= 3) {
    concerns.push(`Activities are limited to ${uniqueCats30d.length} categor${uniqueCats30d.length === 1 ? "y" : "ies"}. Ofsted expects a varied programme covering sport, creative, educational, social, cultural, and outdoor experiences.`);
  }

  if (newExp30d.length === 0 && act30d.length >= 3) {
    concerns.push("No new experiences introduced in 30 days. Children benefit from trying new things — it builds confidence, broadens horizons, and supports positive identity development.");
  }

  const refusingChildren = child_profiles.filter((p) => p.participation_rate < 50 && p.activities_30d >= 2);
  if (refusingChildren.length > 0) {
    concerns.push(`${refusingChildren.length} child${refusingChildren.length !== 1 ? "ren" : ""} have low participation rates. Consider whether activities are well-matched to their interests — consult with each child about what they would enjoy.`);
  }

  const noFeedback = child_profiles.filter((p) => !p.has_feedback && p.activities_30d >= 2);
  if (noFeedback.length > 0 && children.length >= 2) {
    concerns.push("Children's feedback on activities is not consistently captured. Their views help shape future provision and demonstrate you value their voice.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: EnrichmentRecommendation[] = [];
  let rank = 0;

  if (children_without_activities.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Plan activities for ${children_without_activities.join(", ")}. Speak with each child about their interests and create an individual activity plan within the next week.`,
      urgency: "soon",
      domain: "inclusion",
      regulatory_ref: "Reg 9",
    });
  }

  if (uniqueCats30d.length <= 2 && act30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Diversify the activity programme. Aim for at least 5 different activity categories per month: sport, creative, outdoor, educational, social, cultural, community, and life skills.",
      urgency: "soon",
      domain: "variety",
      regulatory_ref: "Reg 9",
    });
  }

  if (act30d.length === 0 && children.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement a weekly activity schedule immediately. Even simple activities (cooking together, park visits, board games) count. Document every activity with category, engagement level, and child feedback.",
      urgency: "immediate",
      domain: "provision",
      regulatory_ref: "Reg 9",
    });
  }

  if (newExp30d.length === 0 && act30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Introduce at least one new experience per child per month. This could be a new sport, visiting a museum, trying a new cuisine, or attending a community event.",
      urgency: "planned",
      domain: "enrichment",
      regulatory_ref: "Reg 9",
    });
  }

  if (ypSuggested.length === 0 && act30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Actively seek children's suggestions for activities. Use house meetings, key work sessions, or an activity wish list to capture their ideas and preferences.",
      urgency: "planned",
      domain: "voice",
      regulatory_ref: "Reg 7",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: EnrichmentInsight[] = [];

  if (enrichment_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Activity enrichment is inadequate (${enrichment_score}%). Ofsted will look for evidence that children enjoy a varied programme of activities — the current provision falls significantly short. This is a potential Reg 9 breach and would be flagged at inspection.`,
    });
  }

  if (act30d.length === 0 && children.length > 0) {
    insights.push({
      severity: "critical",
      text: "No activities have been recorded in 30 days. This is a critical gap. Even if activities are happening informally, they must be documented to evidence that children are receiving enriching experiences.",
    });
  }

  if (enrichment_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Activity enrichment is outstanding (${enrichment_score}%). Children are accessing a broad, varied, and engaging programme of activities. This is exactly the kind of provision that Ofsted considers 'outstanding' under Reg 9 — children are enjoying, achieving, and experiencing new things.`,
    });
  }

  if (ypSuggested.length >= 2 && uniqueCats30d.length >= 5 && newExp30d.length >= 2) {
    insights.push({
      severity: "positive",
      text: "The activity programme shows strong child-centred planning: children suggest activities, there is excellent category variety, and new experiences are regularly introduced. This demonstrates a home where children's interests and aspirations are actively nurtured.",
    });
  }

  if (children_without_activities.length === 0 && child_profiles.every((p) => p.activity_score >= 50) && children.length >= 2) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children are actively engaged in the activity programme with adequate or better provision. Inclusive participation across the home demonstrates effective planning that accounts for each child's needs and preferences.`,
    });
  }

  return {
    generated_at: today,
    enrichment_rating,
    enrichment_score,
    headline,
    provision,
    category_breakdown,
    child_profiles,
    children_without_activities,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
