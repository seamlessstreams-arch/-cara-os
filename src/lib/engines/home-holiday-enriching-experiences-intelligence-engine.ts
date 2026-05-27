// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HOLIDAY & ENRICHING EXPERIENCES INTELLIGENCE ENGINE
// Pure deterministic engine: holiday records, care anniversaries, child
// voice in planning, memorable experiences, and celebration of milestones.
// CHR 2015 Reg 9: "Promoting good health and enjoyment." SCCIF: Experiences.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HolidayRecordInput {
  id: string;
  child_id: string;
  duration_days: number;
  child_chose_destination: boolean;
  has_highlights: boolean;
  photos_taken: boolean;
  has_child_voice: boolean;
  challenges_count: number;
}

export interface CareAnniversaryInput {
  id: string;
  child_id: string;
  anniversary_type: string; // "admission"|"birthday"|"family_event"|"cultural"|"memorial"|"achievement"
  child_attitude: string; // "positive"|"neutral"|"anxious"|"distressed"|"mixed"
  has_upcoming_plan: boolean;
  support_in_place_count: number;
  triggers_count: number;
  has_child_voice: boolean;
}

export interface HolidayExperiencesInput {
  today: string;
  total_children: number;
  holidays: HolidayRecordInput[];
  anniversaries: CareAnniversaryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HolidayExperiencesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HolidayExperiencesResult {
  experiences_rating: HolidayExperiencesRating;
  experiences_score: number;
  headline: string;
  total_holidays: number;
  child_choice_rate: number;
  photos_documented_rate: number;
  child_voice_rate: number;
  anniversaries_planned_rate: number;
  positive_anniversary_rate: number;
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

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HolidayExperiencesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHolidayEnrichingExperiences(
  input: HolidayExperiencesInput,
): HolidayExperiencesResult {
  const { holidays, anniversaries, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      experiences_rating: "insufficient_data",
      experiences_score: 0,
      headline: "No children data available for experience analysis",
      total_holidays: 0,
      child_choice_rate: 0,
      photos_documented_rate: 0,
      child_voice_rate: 0,
      anniversaries_planned_rate: 0,
      positive_anniversary_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const totalHolidays = holidays.length;
  const childChoice = holidays.filter(h => h.child_chose_destination).length;
  const childChoiceRate = pct(childChoice, totalHolidays);

  const photosDocumented = holidays.filter(h => h.photos_taken).length;
  const photosRate = pct(photosDocumented, totalHolidays);

  // Child voice: across both holidays and anniversaries
  const holidayVoice = holidays.filter(h => h.has_child_voice).length;
  const annivVoice = anniversaries.filter(a => a.has_child_voice).length;
  const totalVoiceItems = totalHolidays + anniversaries.length;
  const childVoiceRate = pct(holidayVoice + annivVoice, totalVoiceItems);

  const annivPlanned = anniversaries.filter(a => a.has_upcoming_plan).length;
  const annivPlannedRate = pct(annivPlanned, anniversaries.length);

  const positiveAnniv = anniversaries.filter(a =>
    a.child_attitude === "positive" || a.child_attitude === "neutral"
  ).length;
  const positiveAnnivRate = pct(positiveAnniv, anniversaries.length);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Child choice in holidays
  if (totalHolidays === 0) {
    score -= 2;
  } else {
    if (childChoiceRate >= 90) score += 5;
    else if (childChoiceRate >= 70) score += 2;
    else if (childChoiceRate < 50) score -= 5;
  }

  // Modifier 2: Photo documentation / memory capture
  if (totalHolidays === 0) {
    // no adjustment
  } else {
    if (photosRate >= 90) score += 6;
    else if (photosRate >= 70) score += 2;
    else if (photosRate < 50) score -= 5;
  }

  // Modifier 3: Child voice captured
  if (totalVoiceItems === 0) {
    score -= 1;
  } else {
    if (childVoiceRate >= 90) score += 5;
    else if (childVoiceRate >= 70) score += 2;
    else if (childVoiceRate < 50) score -= 4;
  }

  // Modifier 4: Anniversary planning
  if (anniversaries.length === 0) {
    score += 1;
  } else {
    if (annivPlannedRate >= 90) score += 5;
    else if (annivPlannedRate >= 70) score += 2;
    else if (annivPlannedRate < 50) score -= 5;
  }

  // Modifier 5: Positive anniversary experiences
  if (anniversaries.length === 0) {
    score += 2;
  } else {
    if (positiveAnnivRate >= 90) score += 4;
    else if (positiveAnnivRate >= 70) score += 1;
    else if (positiveAnnivRate < 50) score -= 4;
  }

  // Modifier 6: Holiday frequency per child
  const holidaysPerChild = totalHolidays / total_children;
  if (holidaysPerChild >= 2) score += 5;
  else if (holidaysPerChild >= 1) score += 2;
  else if (holidaysPerChild < 0.5 && totalHolidays > 0) score -= 3;
  else if (totalHolidays === 0) score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Children enjoy rich, child-led holiday experiences with thoughtful anniversary support";
      break;
    case "good":
      headline = "Good range of holiday experiences with effective milestone planning";
      break;
    case "adequate":
      headline = "Holiday and experience provision is adequate but could be more child-centred";
      break;
    case "inadequate":
      headline = "Children's access to enriching experiences and milestone support is inadequate";
      break;
    default:
      headline = "No children data available for experience analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childChoiceRate >= 90 && totalHolidays > 0) strengths.push("Children consistently choose their own holiday destinations — promoting agency and independence");
  if (photosRate >= 90 && totalHolidays > 0) strengths.push("Excellent photo documentation creates lasting memories for children's life story work");
  if (childVoiceRate >= 90 && totalVoiceItems > 0) strengths.push("Children's voices are consistently captured in holiday and anniversary planning");
  if (annivPlannedRate >= 90 && anniversaries.length > 0) strengths.push("All significant anniversaries have proactive plans in place");
  if (positiveAnnivRate >= 90 && anniversaries.length > 0) strengths.push("Children experience anniversaries positively thanks to thoughtful support");
  if (holidaysPerChild >= 2) strengths.push("Children benefit from multiple holiday experiences per year");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (totalHolidays === 0) concerns.push("No holiday experiences recorded — children may be missing out on enriching opportunities");
  if (childChoiceRate < 50 && totalHolidays > 0) concerns.push("Children are not consistently involved in choosing holiday destinations");
  if (photosRate < 50 && totalHolidays > 0) concerns.push("Poor photo documentation means memories are not being preserved for children");
  if (childVoiceRate < 50 && totalVoiceItems > 0) concerns.push("Children's views are not being captured about their experiences and important dates");
  if (annivPlannedRate < 50 && anniversaries.length > 0) concerns.push("Significant anniversaries lack proactive planning — children may not feel supported");
  if (positiveAnnivRate < 50 && anniversaries.length > 0) concerns.push("Many children experience anniversaries negatively — review support approaches");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: HolidayExperiencesResult["recommendations"] = [];

  if (totalHolidays === 0) {
    recs.push({ rank: 1, recommendation: "Plan and provide holiday experiences for all children as a priority", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (childChoiceRate < 70 && totalHolidays > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure children are involved in choosing holiday destinations and activities", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  }
  if (photosRate < 70 && totalHolidays > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Improve photo documentation of holidays for life story and memory work", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (childVoiceRate < 70 && totalVoiceItems > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Capture children's voices about their experiences and important dates", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (annivPlannedRate < 70 && anniversaries.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop proactive plans for all children's significant anniversaries", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  }
  if (positiveAnnivRate < 70 && anniversaries.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review anniversary support strategies for children experiencing distress", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 9" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: HolidayExperiencesResult["insights"] = [];

  if (childChoiceRate >= 90 && photosRate >= 90 && totalHolidays > 0) {
    insights.push({ text: "Holiday provision is child-centred with excellent memory-making — children build positive life narratives", severity: "positive" });
  }
  if (totalHolidays === 0) {
    insights.push({ text: "Absence of holiday experiences is a significant gap — looked-after children deserve enriching experiences equal to their peers", severity: "critical" });
  }
  if (positiveAnnivRate < 50 && anniversaries.length > 0) {
    insights.push({ text: "High proportion of difficult anniversary experiences suggests support strategies need reviewing", severity: "warning" });
  }
  if (annivPlannedRate >= 90 && positiveAnnivRate >= 80 && anniversaries.length > 0) {
    insights.push({ text: "Anniversary planning is proactive and effective — children feel supported through significant dates", severity: "positive" });
  }
  if (childVoiceRate < 50 && totalVoiceItems > 0) {
    insights.push({ text: "Limited capture of children's voices about experiences may indicate a gap in participation", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    experiences_rating: rating,
    experiences_score: score,
    headline,
    total_holidays: totalHolidays,
    child_choice_rate: childChoiceRate,
    photos_documented_rate: photosRate,
    child_voice_rate: childVoiceRate,
    anniversaries_planned_rate: annivPlannedRate,
    positive_anniversary_rate: positiveAnnivRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
