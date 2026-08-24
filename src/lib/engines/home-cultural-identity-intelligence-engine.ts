// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CULTURAL IDENTITY & HERITAGE INTELLIGENCE ENGINE
// Home-level: aggregates cultural identity plans, cultural visits,
// religious observance records, heritage language records, and
// diversity calendar events.
// CHR 2015 Reg 5/6: Engaging with the community, quality of care.
// UNCRC Article 30: Ethnic, religious, or linguistic minorities.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface CulturalIdentityPlanInput {
  id: string;
  child_id: string;
  last_reviewed: string;
  next_review: string;
  identity_areas_count: number;
  celebrations_count: number;
  resources_count: number;
  child_contributed: boolean;
}

export interface CulturalVisitInput {
  id: string;
  date: string;
  children_attended_count: number;
  learning_outcomes_count: number;
  child_comments_count: number;
  repeat_visit_interest: boolean;
}

export interface ReligiousObservanceInput {
  id: string;
  child_id: string;
  practices_count: number;
  practices_supported_count: number;
  festivals_count: number;
  child_authored: boolean;
  next_review_date: string;
}

export interface HeritageLanguageInput {
  id: string;
  child_id: string;
  languages_count: number;
  opportunities_count: number;
  community_resources_count: number;
  home_atmosphere_supports: boolean;
  child_voice_provided: boolean;
  review_date: string;
}

export interface DiversityCalendarInput {
  id: string;
  date: string;
  status: string; // "planned" | "completed" | "cancelled"
  resources_count: number;
}

export interface HomeCulturalIdentityInput {
  today: string;
  cultural_identity_plans: CulturalIdentityPlanInput[];
  cultural_visits: CulturalVisitInput[];
  religious_observance_records: ReligiousObservanceInput[];
  heritage_language_records: HeritageLanguageInput[];
  diversity_calendar_events: DiversityCalendarInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type CulturalIdentityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IdentityPlanProfile {
  total_plans: number;
  child_coverage: number;
  overdue_reviews: number;
  avg_identity_areas: number | null;
  child_contribution_rate: number | null;
}

export interface CulturalVisitProfile {
  total_visits_90d: number;
  avg_children_per_visit: number | null;
  learning_outcomes_rate: number | null;
  repeat_interest_rate: number | null;
}

export interface ReligiousObservanceProfile {
  total_records: number;
  child_coverage: number;
  avg_practices_supported: number | null;
  child_authored_rate: number | null;
  overdue_reviews: number;
}

export interface HeritageLanguageProfile {
  total_records: number;
  child_coverage: number;
  home_support_rate: number | null;
  child_voice_rate: number | null;
  overdue_reviews: number;
}

export interface DiversityCalendarProfile {
  total_events: number;
  completed_rate: number | null;
  upcoming_count: number;
}

export interface HomeCulturalIdentityResult {
  cultural_identity_rating: CulturalIdentityRating;
  cultural_identity_score: number | null;
  headline: string;
  identity_plans: IdentityPlanProfile;
  cultural_visits: CulturalVisitProfile;
  religious_observance: ReligiousObservanceProfile;
  heritage_language: HeritageLanguageProfile;
  diversity_calendar: DiversityCalendarProfile;
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

export function computeHomeCulturalIdentity(
  input: HomeCulturalIdentityInput,
): HomeCulturalIdentityResult {
  const {
    today, cultural_identity_plans, cultural_visits,
    religious_observance_records, heritage_language_records,
    diversity_calendar_events, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    cultural_identity_plans.length === 0 &&
    cultural_visits.length === 0 &&
    religious_observance_records.length === 0 &&
    heritage_language_records.length === 0 &&
    diversity_calendar_events.length === 0
  ) {
    return {
      cultural_identity_rating: "insufficient_data",
      cultural_identity_score: 0,
      headline: "No cultural identity or heritage data available for analysis.",
      identity_plans: { total_plans: 0, child_coverage: 0, overdue_reviews: 0, avg_identity_areas: 0, child_contribution_rate: null },
      cultural_visits: { total_visits_90d: 0, avg_children_per_visit: 0, learning_outcomes_rate: null, repeat_interest_rate: null },
      religious_observance: { total_records: 0, child_coverage: 0, avg_practices_supported: 0, child_authored_rate: null, overdue_reviews: 0 },
      heritage_language: { total_records: 0, child_coverage: 0, home_support_rate: null, child_voice_rate: null, overdue_reviews: 0 },
      diversity_calendar: { total_events: 0, completed_rate: null, upcoming_count: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Identity plan analysis ───────────────────────────────────────────
  const ipChildIds = new Set(cultural_identity_plans.map(p => p.child_id));
  const ipCoverage = pct(ipChildIds.size, total_children);
  const ipOverdue = cultural_identity_plans.filter(p => daysBetween(p.next_review, today) > 0).length;
  const ipAvgAreas = cultural_identity_plans.length > 0
    ? Math.round(cultural_identity_plans.reduce((s, p) => s + p.identity_areas_count, 0) / cultural_identity_plans.length)
    : null;
  const ipContribRate = pct(
    cultural_identity_plans.filter(p => p.child_contributed).length,
    cultural_identity_plans.length,
  );

  const identity_plans: IdentityPlanProfile = {
    total_plans: cultural_identity_plans.length,
    child_coverage: ipCoverage,
    overdue_reviews: ipOverdue,
    avg_identity_areas: ipAvgAreas,
    child_contribution_rate: ipContribRate,
  };

  // ── Cultural visit analysis (last 90 days) ───────────────────────────
  const cv90 = cultural_visits.filter(v => daysBetween(v.date, today) >= 0 && daysBetween(v.date, today) <= 90);
  const cvAvgChildren = cv90.length > 0
    ? Math.round((cv90.reduce((s, v) => s + v.children_attended_count, 0) / cv90.length) * 10) / 10
    : null;
  const cvLearningRate = pct(
    cv90.filter(v => v.learning_outcomes_count > 0).length,
    cv90.length,
  );
  const cvRepeatRate = pct(
    cv90.filter(v => v.repeat_visit_interest).length,
    cv90.length,
  );

  const cultural_visits_profile: CulturalVisitProfile = {
    total_visits_90d: cv90.length,
    avg_children_per_visit: cvAvgChildren,
    learning_outcomes_rate: cvLearningRate,
    repeat_interest_rate: cvRepeatRate,
  };

  // ── Religious observance analysis ────────────────────────────────────
  const roChildIds = new Set(religious_observance_records.map(r => r.child_id));
  const roCoverage = pct(roChildIds.size, total_children);
  const roAvgSupported = religious_observance_records.length > 0
    ? Math.round(religious_observance_records.reduce((s, r) => s + r.practices_supported_count, 0) / religious_observance_records.length)
    : null;
  const roAuthoredRate = pct(
    religious_observance_records.filter(r => r.child_authored).length,
    religious_observance_records.length,
  );
  const roOverdue = religious_observance_records.filter(r => daysBetween(r.next_review_date, today) > 0).length;

  const religious_observance: ReligiousObservanceProfile = {
    total_records: religious_observance_records.length,
    child_coverage: roCoverage,
    avg_practices_supported: roAvgSupported,
    child_authored_rate: roAuthoredRate,
    overdue_reviews: roOverdue,
  };

  // ── Heritage language analysis ───────────────────────────────────────
  const hlChildIds = new Set(heritage_language_records.map(r => r.child_id));
  const hlCoverage = pct(hlChildIds.size, total_children);
  const hlHomeRate = pct(
    heritage_language_records.filter(r => r.home_atmosphere_supports).length,
    heritage_language_records.length,
  );
  const hlVoiceRate = pct(
    heritage_language_records.filter(r => r.child_voice_provided).length,
    heritage_language_records.length,
  );
  const hlOverdue = heritage_language_records.filter(r => daysBetween(r.review_date, today) > 0).length;

  const heritage_language: HeritageLanguageProfile = {
    total_records: heritage_language_records.length,
    child_coverage: hlCoverage,
    home_support_rate: hlHomeRate,
    child_voice_rate: hlVoiceRate,
    overdue_reviews: hlOverdue,
  };

  // ── Diversity calendar analysis ──────────────────────────────────────
  const dcCompleted = diversity_calendar_events.filter(e => e.status === "completed").length;
  const dcCompletedRate = pct(dcCompleted, diversity_calendar_events.length);
  const dcUpcoming = diversity_calendar_events.filter(e =>
    e.status === "planned" && daysBetween(today, e.date) >= 0,
  ).length;

  const diversity_calendar: DiversityCalendarProfile = {
    total_events: diversity_calendar_events.length,
    completed_rate: dcCompletedRate,
    upcoming_count: dcUpcoming,
  };

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max ±28) → max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Identity plan coverage & quality (±5) ─────────────────────
  {
    let m = 0;
    if (cultural_identity_plans.length > 0) {
      if (ipCoverage >= 90) m += 2;
      else if (ipCoverage >= 60) m += 1;
      else m -= 1;

      if (ipContribRate >= 90) m += 2;
      else if (ipContribRate >= 60) m += 1;
      else if (ipContribRate < 30) m -= 2;

      if (ipOverdue === 0) m += 1;
      else if (ipOverdue >= 3) m -= 2;
    } else {
      if (total_children >= 2) m -= 3;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Cultural visit engagement (±4) ────────────────────────────
  {
    let m = 0;
    if (cv90.length > 0) {
      if (cv90.length >= 6) m += 2;
      else if (cv90.length >= 3) m += 1;
      else m -= 1;

      if (cvLearningRate >= 80) m += 1;
      else if (cvLearningRate < 30) m -= 1;

      if (cvRepeatRate >= 60) m += 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Religious observance support (±3) ─────────────────────────
  {
    let m = 0;
    if (religious_observance_records.length > 0) {
      if (roAuthoredRate >= 80) m += 1;
      else if (roAuthoredRate < 30) m -= 1;

      if ((roAvgSupported ?? 0) >= 3) m += 1;
      else if ((roAvgSupported ?? 0) < 1) m -= 1;

      if (roOverdue === 0) m += 1;
      else if (roOverdue >= 3) m -= 1;
    }
    // No religious observance records is neutral — not all children have identified faith
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 4: Heritage language preservation (±4) ───────────────────────
  {
    let m = 0;
    if (heritage_language_records.length > 0) {
      if (hlHomeRate >= 80) m += 2;
      else if (hlHomeRate >= 50) m += 1;
      else m -= 1;

      if (hlVoiceRate >= 80) m += 1;
      else if (hlVoiceRate < 30) m -= 1;

      if (hlOverdue === 0) m += 1;
      else if (hlOverdue >= 3) m -= 2;
    }
    // No heritage language records is neutral — not all children have heritage language needs
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 5: Diversity calendar engagement (±3) ────────────────────────
  {
    let m = 0;
    if (diversity_calendar_events.length > 0) {
      if (dcCompletedRate >= 80) m += 2;
      else if (dcCompletedRate >= 50) m += 1;
      else if (dcCompletedRate < 20) m -= 1;

      if (dcUpcoming >= 2) m += 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Child voice across cultural domains (±3) ──────────────────
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (cultural_identity_plans.length > 0) voiceSources.push(ipContribRate);
    if (religious_observance_records.length > 0) voiceSources.push(roAuthoredRate);
    if (heritage_language_records.length > 0) voiceSources.push(hlVoiceRate);
    if (cv90.length > 0) {
      const cvCommentRate = pct(cv90.filter(v => v.child_comments_count > 0).length, cv90.length);
      voiceSources.push(cvCommentRate);
    }

    if (voiceSources.length > 0) {
      const avgVoice = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avgVoice >= 90) m += 3;
      else if (avgVoice >= 70) m += 2;
      else if (avgVoice >= 50) m += 1;
      else if (avgVoice < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Review compliance across domains (±3) ─────────────────────
  {
    let m = 0;
    const totalOverdue = ipOverdue + roOverdue + hlOverdue;
    const totalReviewable = cultural_identity_plans.length + religious_observance_records.length + heritage_language_records.length;

    if (totalReviewable > 0) {
      const overdueRate = pct(totalOverdue, totalReviewable);
      if (overdueRate === 0) m += 3;
      else if (overdueRate <= 10) m += 2;
      else if (overdueRate <= 25) m += 1;
      else if (overdueRate > 50) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Resource & celebration richness (±3) ──────────────────────
  {
    let m = 0;
    if (cultural_identity_plans.length > 0) {
      const avgCelebrations = Math.round(
        cultural_identity_plans.reduce((s, p) => s + p.celebrations_count, 0) / cultural_identity_plans.length,
      );
      const avgResources = Math.round(
        cultural_identity_plans.reduce((s, p) => s + p.resources_count, 0) / cultural_identity_plans.length,
      );

      if (avgCelebrations >= 3) m += 1;
      else if (avgCelebrations < 1) m -= 1;

      if (avgResources >= 3) m += 1;
      else if (avgResources < 1) m -= 1;

      if (diversity_calendar_events.length >= 6) m += 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let cultural_identity_rating: CulturalIdentityRating;
  if (score >= 80) cultural_identity_rating = "outstanding";
  else if (score >= 65) cultural_identity_rating = "good";
  else if (score >= 45) cultural_identity_rating = "adequate";
  else cultural_identity_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeCulturalIdentityResult["recommendations"] = [];
  const insights: HomeCulturalIdentityResult["insights"] = [];
  let rank = 0;

  // Identity plans
  if (cultural_identity_plans.length > 0 && ipCoverage >= 90 && ipContribRate >= 90) {
    strengths.push(`Excellent cultural identity planning — ${ipCoverage}% coverage with ${ipContribRate}% child contribution.`);
  }
  if (cultural_identity_plans.length === 0 && total_children >= 2) {
    concerns.push("No cultural identity plans in place — children's cultural needs are not being formally assessed or planned for.");
    recommendations.push({ rank: ++rank, recommendation: "Create cultural identity plans for all children with their active participation.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 6" });
  }
  if (ipOverdue >= 3) {
    concerns.push(`${ipOverdue} cultural identity plans are overdue for review.`);
    recommendations.push({ rank: ++rank, recommendation: "Schedule overdue cultural identity plan reviews — ensure children co-produce updates.", urgency: "soon", regulatory_ref: null });
  }

  // Cultural visits
  if (cv90.length >= 6 && cvLearningRate >= 80) {
    strengths.push(`Active cultural visit programme — ${cv90.length} visits in 90 days with ${cvLearningRate}% achieving learning outcomes.`);
  }
  if (cv90.length === 0 && total_children >= 2) {
    concerns.push("No cultural visits in the last 90 days.");
    recommendations.push({ rank: ++rank, recommendation: "Plan cultural visits to support children's identity development and community connection.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  // Religious observance
  if (religious_observance_records.length > 0 && roAuthoredRate >= 80) {
    strengths.push(`Strong child-authored religious observance records — ${roAuthoredRate}% child-led.`);
  }
  if (roOverdue >= 3) {
    concerns.push(`${roOverdue} religious observance records are overdue for review.`);
  }

  // Heritage language
  if (heritage_language_records.length > 0 && hlHomeRate >= 80 && hlVoiceRate >= 80) {
    strengths.push("Excellent heritage language support — home actively supports language preservation with child voice captured.");
  }
  if (heritage_language_records.length > 0 && hlHomeRate < 30) {
    concerns.push(`Low home atmosphere support for heritage languages — only ${hlHomeRate}% of records show active support.`);
    recommendations.push({ rank: ++rank, recommendation: "Review how the home environment can better support children's heritage languages.", urgency: "planned", regulatory_ref: "UNCRC Art 30" });
  }

  // Diversity calendar
  if (diversity_calendar_events.length > 0 && dcCompletedRate >= 80) {
    strengths.push(`Strong diversity calendar engagement — ${dcCompletedRate}% of events completed.`);
  }

  // ── Cara Insights ────────────────────────────────────────────────────
  if (cultural_identity_plans.length > 0 && ipCoverage < 50 && total_children >= 3) {
    insights.push({ text: `Only ${ipCoverage}% of children have cultural identity plans — significant identity needs may be unmet.`, severity: "warning" });
  }
  if (heritage_language_records.length > 0) {
    const multiLang = heritage_language_records.filter(r => r.languages_count >= 2).length;
    if (multiLang >= 2) {
      insights.push({ text: `${multiLang} children speak multiple heritage languages — ensure interpreting and community connection support.`, severity: "positive" });
    }
  }
  if (religious_observance_records.length > 0 && roAuthoredRate >= 90) {
    insights.push({ text: "Outstanding child authorship of religious observance records — children are leading their own faith journey documentation.", severity: "positive" });
  }
  if (cv90.length >= 4 && cvRepeatRate >= 60) {
    insights.push({ text: "High repeat-visit interest suggests cultural visits are meaningful and valued by children.", severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (cultural_identity_rating === "outstanding") {
    headline = "Cultural identity, heritage, and diversity practice is embedded and child-led across the home.";
  } else if (cultural_identity_rating === "good") {
    headline = "Good cultural identity support with opportunities to deepen child co-production.";
  } else if (cultural_identity_rating === "adequate") {
    headline = "Cultural identity practice is developing but gaps exist in coverage and engagement.";
  } else {
    headline = "Significant gaps in cultural identity support — children's heritage and identity needs may not be met.";
  }

  return {
    cultural_identity_rating,
    cultural_identity_score: score,
    headline,
    identity_plans,
    cultural_visits: cultural_visits_profile,
    religious_observance,
    heritage_language,
    diversity_calendar,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
