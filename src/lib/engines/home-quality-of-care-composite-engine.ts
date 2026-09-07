import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME QUALITY OF CARE COMPOSITE ENGINE
// Merges child voice, participation, key-working quality, cultural identity,
// life story work, therapeutic climate, and emotional literacy across all children.
// Pure deterministic engine. CHR 2015 Reg 5/6/7/9/10.
// ══════════════════════════════════════════════════════════════════════════════

export interface QualityOfCareInput {
  today: string;
  total_children: number;

  // Child voice
  feedback_entries_total: number;
  feedback_entries_acted_on: number;
  house_meetings_held: number;
  house_meetings_due: number;
  children_with_voice_captured: number;

  // Participation
  children_on_council_or_forum: number;
  advocacy_referrals_offered: number;
  advocacy_referrals_accepted: number;

  // Key working
  keywork_sessions_completed: number;
  keywork_sessions_due: number;
  children_with_keyworker_allocated: number;

  // Cultural identity
  children_with_cultural_plan: number;
  cultural_visits_completed: number;
  cultural_visits_planned: number;
  diversity_events_held: number;
  heritage_language_supported: number;

  // Life story work
  children_with_life_story: number;
  life_stories_up_to_date: number;
  children_with_personal_passport: number;

  // Therapeutic climate
  children_with_attachment_profile: number;
  therapeutic_sessions_attended: number;
  therapeutic_sessions_offered: number;
  children_with_sensory_profile: number;
  emotional_vocab_sessions: number;

  // Friendship & social
  children_with_friendship_map: number;
  children_with_aspiration_record: number;
}

export type QualityOfCareRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface QoCDomainScore {
  name: string;
  score: number;
  max: number;
  quality_met: boolean;
}

export interface QualityOfCareResult {
  quality_rating: QualityOfCareRating;
  /** null when the population is empty — nothing measured, not 0%. */
  quality_score: number | null;
  headline: string;
  domain_scores: QoCDomainScore[];
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

export function computeQualityOfCare(input: QualityOfCareInput): QualityOfCareResult {
  const tc = input.total_children;

  if (tc === 0) {
    return {
      quality_rating: "insufficient_data", quality_score: 0,
      headline: "No children in placement — quality of care composite cannot be assessed.",
      domain_scores: [], strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Domain: Child Voice (0–20) ──────────────────────────────────────────
  let voiceScore = 0;
  const feedbackActRate = rate(input.feedback_entries_acted_on, input.feedback_entries_total);
  if (input.feedback_entries_total === 0) {
    voiceScore += 3; // low — no feedback captured
  } else {
    if (meets(feedbackActRate, 90)) voiceScore += 8;
    else if (meets(feedbackActRate, 70)) voiceScore += 5;
    else if (meets(feedbackActRate, 50)) voiceScore += 3;
    else voiceScore += 1;
  }
  const meetRate = rate(input.house_meetings_held, input.house_meetings_due);
  if (input.house_meetings_due === 0) {
    voiceScore += 3;
  } else {
    if (meets(meetRate, 90)) voiceScore += 6;
    else if (meets(meetRate, 75)) voiceScore += 4;
    else if (meets(meetRate, 50)) voiceScore += 2;
    else voiceScore += 1;
  }
  const voiceCoverage = rate(input.children_with_voice_captured, tc);
  if (meets(voiceCoverage, 90)) voiceScore += 6;
  else if (meets(voiceCoverage, 70)) voiceScore += 4;
  else if (meets(voiceCoverage, 50)) voiceScore += 2;
  else voiceScore += 0;
  voiceScore = Math.min(voiceScore, 20);
  const voiceMet = meets(voiceCoverage, 70) && meets(feedbackActRate, 70);

  // ── Domain: Participation (0–10) ────────────────────────────────────────
  let partScore = 0;
  const councilRate = rate(input.children_on_council_or_forum, tc);
  if (meets(councilRate, 50)) partScore += 5;
  else if (meets(councilRate, 25)) partScore += 3;
  else if (above(councilRate, 0)) partScore += 1;
  else partScore += 0;
  const advRate = rate(input.advocacy_referrals_accepted, input.advocacy_referrals_offered);
  if (input.advocacy_referrals_offered === 0) {
    partScore += 2; // neutral
  } else {
    if (meets(advRate, 80)) partScore += 5;
    else if (meets(advRate, 50)) partScore += 3;
    else partScore += 1;
  }
  partScore = Math.min(partScore, 10);
  const partMet = meets(councilRate, 25);

  // ── Domain: Key Working (0–20) ──────────────────────────────────────────
  let kwScore = 0;
  const kwRate = rate(input.keywork_sessions_completed, input.keywork_sessions_due);
  if (input.keywork_sessions_due === 0) {
    kwScore += 8;
  } else {
    if (meets(kwRate, 90)) kwScore += 12;
    else if (meets(kwRate, 75)) kwScore += 8;
    else if (meets(kwRate, 50)) kwScore += 4;
    else kwScore += 1;
  }
  const kwAlloc = rate(input.children_with_keyworker_allocated, tc);
  if (meets(kwAlloc, 100)) kwScore += 8;
  else if (meets(kwAlloc, 80)) kwScore += 5;
  else if (meets(kwAlloc, 60)) kwScore += 2;
  else kwScore += 0;
  kwScore = Math.min(kwScore, 20);
  const kwMet = meets(kwAlloc, 80) && meets(kwRate, 75);

  // ── Domain: Cultural Identity (0–15) ────────────────────────────────────
  let culScore = 0;
  const culPlanRate = rate(input.children_with_cultural_plan, tc);
  if (meets(culPlanRate, 90)) culScore += 5;
  else if (meets(culPlanRate, 70)) culScore += 3;
  else if (meets(culPlanRate, 50)) culScore += 1;
  else culScore += 0;
  const culVisitRate = rate(input.cultural_visits_completed, input.cultural_visits_planned);
  if (input.cultural_visits_planned === 0) {
    culScore += 3;
  } else {
    if (meets(culVisitRate, 80)) culScore += 4;
    else if (meets(culVisitRate, 60)) culScore += 2;
    else culScore += 1;
  }
  if (input.diversity_events_held >= 4) culScore += 3;
  else if (input.diversity_events_held >= 2) culScore += 2;
  else if (input.diversity_events_held >= 1) culScore += 1;
  const herRate = rate(input.heritage_language_supported, tc);
  if (meets(herRate, 80)) culScore += 3;
  else if (meets(herRate, 50)) culScore += 2;
  else if (above(herRate, 0)) culScore += 1;
  else culScore += 0;
  culScore = Math.min(culScore, 15);
  const culMet = meets(culPlanRate, 70);

  // ── Domain: Life Story (0–15) ───────────────────────────────────────────
  let lsScore = 0;
  const lsRate = rate(input.children_with_life_story, tc);
  if (meets(lsRate, 90)) lsScore += 6;
  else if (meets(lsRate, 70)) lsScore += 4;
  else if (meets(lsRate, 50)) lsScore += 2;
  else lsScore += 0;
  const lsUpToDate = rate(input.life_stories_up_to_date, input.children_with_life_story);
  if (input.children_with_life_story === 0) {
    lsScore += 0;
  } else {
    if (meets(lsUpToDate, 90)) lsScore += 5;
    else if (meets(lsUpToDate, 70)) lsScore += 3;
    else if (meets(lsUpToDate, 50)) lsScore += 1;
    else lsScore += 0;
  }
  const ppRate = rate(input.children_with_personal_passport, tc);
  if (meets(ppRate, 90)) lsScore += 4;
  else if (meets(ppRate, 70)) lsScore += 2;
  else if (meets(ppRate, 50)) lsScore += 1;
  else lsScore += 0;
  lsScore = Math.min(lsScore, 15);
  const lsMet = meets(lsRate, 70);

  // ── Domain: Therapeutic Climate (0–15) ──────────────────────────────────
  let thScore = 0;
  const attachRate = rate(input.children_with_attachment_profile, tc);
  if (meets(attachRate, 90)) thScore += 4;
  else if (meets(attachRate, 70)) thScore += 2;
  else thScore += 0;
  const thAttendRate = rate(input.therapeutic_sessions_attended, input.therapeutic_sessions_offered);
  if (input.therapeutic_sessions_offered === 0) {
    thScore += 3;
  } else {
    if (meets(thAttendRate, 80)) thScore += 4;
    else if (meets(thAttendRate, 60)) thScore += 2;
    else thScore += 1;
  }
  const sensRate = rate(input.children_with_sensory_profile, tc);
  if (meets(sensRate, 80)) thScore += 3;
  else if (meets(sensRate, 50)) thScore += 2;
  else thScore += 1;
  if (input.emotional_vocab_sessions >= 8) thScore += 4;
  else if (input.emotional_vocab_sessions >= 4) thScore += 2;
  else if (input.emotional_vocab_sessions >= 1) thScore += 1;
  else thScore += 0;
  thScore = Math.min(thScore, 15);
  const thMet = meets(attachRate, 70) && (meets(thAttendRate, 60) || input.therapeutic_sessions_offered === 0);

  // ── Domain: Social Connectedness (0–5) ──────────────────────────────────
  let socScore = 0;
  const fmRate = rate(input.children_with_friendship_map, tc);
  if (meets(fmRate, 80)) socScore += 3;
  else if (meets(fmRate, 50)) socScore += 2;
  else if (above(fmRate, 0)) socScore += 1;
  const aspRate = rate(input.children_with_aspiration_record, tc);
  if (meets(aspRate, 80)) socScore += 2;
  else if (meets(aspRate, 50)) socScore += 1;
  socScore = Math.min(socScore, 5);
  const socMet = meets(fmRate, 50);

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalScore = voiceScore + partScore + kwScore + culScore + lsScore + thScore + socScore;
  const maxScore = 20 + 10 + 20 + 15 + 15 + 15 + 5; // = 100
  const quality_score = rate(totalScore, maxScore);
  const quality_rating: QualityOfCareRating =
    meets(quality_score, 80) ? "outstanding" :
    meets(quality_score, 65) ? "good" :
    meets(quality_score, 45) ? "adequate" : "inadequate";

  // ── Domain scores ───────────────────────────────────────────────────────
  const domain_scores: QoCDomainScore[] = [
    { name: "child_voice", score: voiceScore, max: 20, quality_met: voiceMet },
    { name: "participation", score: partScore, max: 10, quality_met: partMet },
    { name: "key_working", score: kwScore, max: 20, quality_met: kwMet },
    { name: "cultural_identity", score: culScore, max: 15, quality_met: culMet },
    { name: "life_story", score: lsScore, max: 15, quality_met: lsMet },
    { name: "therapeutic_climate", score: thScore, max: 15, quality_met: thMet },
    { name: "social_connectedness", score: socScore, max: 5, quality_met: socMet },
  ];

  const qualityMetDomains = domain_scores.filter(d => d.quality_met);
  const qualityGaps = domain_scores.filter(d => !d.quality_met);

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (qualityMetDomains.length === 7) strengths.push("Quality thresholds met across all 7 domains — exceptional holistic care.");
  else if (qualityMetDomains.length >= 5) strengths.push(`Quality met in ${qualityMetDomains.length} of 7 domains — strong care foundations.`);
  if (meets(voiceCoverage, 90)) strengths.push("Over 90% of children have their voice captured — child-centred practice embedded.");
  if (meets(kwAlloc, 100)) strengths.push("Every child has an allocated keyworker — relational care is prioritised.");
  if (meets(lsRate, 90)) strengths.push("Life story work established for over 90% of children — identity needs actively supported.");
  if (input.diversity_events_held >= 4) strengths.push("Regular diversity events demonstrate proactive cultural awareness.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (qualityGaps.length >= 4) concerns.push(`${qualityGaps.length} of 7 quality domains below threshold — systemic quality of care issues.`);
  else if (qualityGaps.length >= 2) concerns.push(`${qualityGaps.length} quality domains below threshold — targeted improvement needed.`);
  if (below(voiceCoverage, 50)) concerns.push(`Only ${voiceCoverage}% of children's voices captured — children are not being heard.`);
  if (below(kwAlloc, 80)) concerns.push(`Only ${kwAlloc}% of children have keyworkers — relational gaps undermine attachment.`);
  if (below(lsRate, 50)) concerns.push(`Less than half of children have life story work — identity needs are unmet.`);
  if (below(culPlanRate, 50)) concerns.push(`Only ${culPlanRate}% of children have cultural identity plans — diversity needs neglected.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (below(kwAlloc, 80)) recommendations.push({ rank: ++rank, recommendation: "Urgently allocate keyworkers to all children — relational care is a fundamental requirement.", urgency: "immediate", regulatory_ref: "Reg 5" });
  if (below(voiceCoverage, 60)) recommendations.push({ rank: ++rank, recommendation: "Implement child voice capture for all children — current coverage is insufficient.", urgency: "immediate", regulatory_ref: "Reg 7" });
  if (below(lsRate, 70)) recommendations.push({ rank: ++rank, recommendation: "Establish life story work for all children — supports identity and belonging.", urgency: "soon", regulatory_ref: "Reg 9" });
  if (below(culPlanRate, 70)) recommendations.push({ rank: ++rank, recommendation: "Develop cultural identity plans for all children — celebrates and sustains heritage.", urgency: "soon", regulatory_ref: "Reg 10" });
  if (above(input.keywork_sessions_due, 0) && below(kwRate, 75)) recommendations.push({ rank: ++rank, recommendation: `Improve keywork session completion from ${kwRate}% — consistent key working builds trust.`, urgency: "soon", regulatory_ref: "Reg 5" });
  if (below(quality_score, 65)) recommendations.push({ rank: ++rank, recommendation: "Develop whole-home quality of care improvement plan targeting weakest domains.", urgency: "planned", regulatory_ref: "Reg 6" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (quality_rating === "outstanding") insights.push({ text: "Quality of care is outstanding — children experience personalised, identity-affirming care across all domains.", severity: "positive" });
  if (quality_rating === "inadequate") insights.push({ text: "Quality of care is inadequate — children's individual needs for voice, identity, and relational support are not being met.", severity: "critical" });
  if (!voiceMet && !kwMet) insights.push({ text: "Both child voice and key working are below quality thresholds — children lack both relational support and mechanisms to be heard.", severity: "critical" });
  if (voiceMet && lsMet && culMet) insights.push({ text: "Strong alignment between child voice, life story, and cultural identity — identity-affirming practice is well-embedded.", severity: "positive" });
  if (qualityGaps.length >= 3 && qualityMetDomains.some(d => d.name === "therapeutic_climate")) insights.push({ text: "Good therapeutic climate but gaps in other care domains — clinical skills are strong but daily relational care needs focus.", severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (quality_rating === "outstanding") headline = `Outstanding quality of care — ${qualityMetDomains.length}/7 domains exceed quality threshold.`;
  else if (quality_rating === "good") headline = `Good quality of care — ${qualityGaps.length > 0 ? `${qualityGaps.length} domain(s) to strengthen` : "consistent quality"}.`;
  else if (quality_rating === "adequate") headline = `Adequate quality of care — ${qualityGaps.length} domain(s) below threshold, focused improvement needed.`;
  else headline = `Quality of care inadequate — ${qualityGaps.length} domain(s) unmet, children's individual needs are not being addressed.`;

  return {
    quality_rating, quality_score, headline,
    domain_scores, strengths, concerns, recommendations, insights,
  };
}
