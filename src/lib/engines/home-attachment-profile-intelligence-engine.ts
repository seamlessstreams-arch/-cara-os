// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ATTACHMENT PROFILE INTELLIGENCE ENGINE
// Pure deterministic engine: attachment profile coverage, assessment currency,
// style distribution, relational quality, therapeutic alignment, child voice,
// staff guidance, and protective factor identification.
// CHR 2015 Reg 9 (Promoting contact) / Reg 10 (Health).
// SCCIF: Experiences and progress; Health and well-being.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { below, meets, rate } from "@/lib/metrics/rate";

export interface AttachmentProfileRecordInput {
  id: string;
  child_id: string;
  status: string; // "active"|"under_review"|"archived"
  primary_style: string; // "secure"|"anxious_ambivalent"|"anxious_avoidant"|"disorganised"|"emerging_secure"
  has_secondary_patterns: boolean;
  has_assessed_by: boolean;
  assessment_date: string; // ISO date
  has_review_date: boolean;
  review_date: string; // ISO date
  has_early_history: boolean;
  has_placement_history: boolean;
  behaviour_count: number;
  behaviours_with_need_count: number; // behaviours that have underlying_need populated
  behaviours_with_response_count: number; // behaviours that have recommended_response populated
  key_relationship_count: number;
  strong_relationship_count: number;
  strained_relationship_count: number;
  therapeutic_approach_count: number;
  staff_guidance_count: number;
  protective_factor_count: number;
  risk_factor_count: number;
  has_child_views: boolean;
  has_professional_input: boolean;
}

export interface AttachmentProfileInput {
  today: string;
  total_children: number;
  profiles: AttachmentProfileRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AttachmentProfileRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AttachmentProfileResult {
  profile_rating: AttachmentProfileRating;
  profile_score: number;
  headline: string;
  total_profiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  children_with_profile_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  active_profile_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  behaviour_analysis_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  strong_relationship_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staff_guidance_rate: number | null;
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

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null {
  return rate(n, d);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AttachmentProfileRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeAttachmentProfile(
  input: AttachmentProfileInput,
): AttachmentProfileResult {
  const { profiles, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      profile_rating: "insufficient_data",
      profile_score: 0,
      headline: "No data available for attachment profile intelligence analysis",
      total_profiles: 0,
      children_with_profile_rate: 0,
      active_profile_rate: 0,
      behaviour_analysis_rate: 0,
      strong_relationship_rate: 0,
      child_voice_rate: 0,
      staff_guidance_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = profiles.length;
  const uniqueChildren = new Set(profiles.map(p => p.child_id)).size;
  const childrenWithProfileRate = pct(uniqueChildren, total_children);

  const activeProfiles = profiles.filter(p => p.status === "active" || p.status === "under_review");
  const activeProfileRate = pct(activeProfiles.length, total);

  // Behaviour analysis: profiles where behaviours have underlying_need AND recommended_response
  const profilesWithBehaviours = profiles.filter(p => p.behaviour_count > 0);
  const profilesWithFullAnalysis = profilesWithBehaviours.filter(
    p => p.behaviours_with_need_count > 0 && p.behaviours_with_response_count > 0,
  );
  const behaviourAnalysisRate = pct(profilesWithFullAnalysis.length, profilesWithBehaviours.length);

  // Relationship quality
  const totalRelationships = profiles.reduce((s, p) => s + p.key_relationship_count, 0);
  const totalStrong = profiles.reduce((s, p) => s + p.strong_relationship_count, 0);
  const strongRelationshipRate = pct(totalStrong, totalRelationships);

  // Child voice
  const withChildVoice = profiles.filter(p => p.has_child_views).length;
  const childVoiceRate = pct(withChildVoice, total);

  // Staff guidance
  const withStaffGuidance = profiles.filter(p => p.staff_guidance_count > 0).length;
  const staffGuidanceRate = pct(withStaffGuidance, total);

  const withTherapeuticApproach = profiles.filter(p => p.therapeutic_approach_count > 0).length;
  const withProtectiveFactors = profiles.filter(p => p.protective_factor_count > 0).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children with profiles (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(childrenWithProfileRate, 80)) score += 6;
    else if (meets(childrenWithProfileRate, 50)) score += 2;
    else if (below(childrenWithProfileRate, 30)) score -= 5;
  }

  // Modifier 2: Active profile currency
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(activeProfileRate, 85)) score += 5;
    else if (meets(activeProfileRate, 60)) score += 2;
    else if (below(activeProfileRate, 40)) score -= 5;
  }

  // Modifier 3: Behaviour analysis depth
  if (total === 0) {
    score -= 1;
  } else {
    if (profilesWithBehaviours.length === 0) score -= 1;
    else if (meets(behaviourAnalysisRate, 75)) score += 5;
    else if (meets(behaviourAnalysisRate, 50)) score += 2;
    else if (below(behaviourAnalysisRate, 25)) score -= 4;
  }

  // Modifier 4: Child voice captured
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(childVoiceRate, 80)) score += 5;
    else if (meets(childVoiceRate, 50)) score += 2;
    else if (below(childVoiceRate, 20)) score -= 4;
  }

  // Modifier 5: Staff guidance availability
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(staffGuidanceRate, 80)) score += 4;
    else if (meets(staffGuidanceRate, 50)) score += 1;
    else if (below(staffGuidanceRate, 20)) score -= 4;
  }

  // Modifier 6: Therapeutic approach & protective factors
  if (total === 0) {
    score -= 2;
  } else {
    const therapeuticRate = pct(withTherapeuticApproach, total);
    const protectiveRate = pct(withProtectiveFactors, total);
    if (meets(therapeuticRate, 75) && meets(protectiveRate, 75)) score += 5;
    else if (meets(therapeuticRate, 50) || meets(protectiveRate, 50)) score += 2;
    else if (below(therapeuticRate, 25) && below(protectiveRate, 25)) score -= 3;
  }

  score = clamp(score, 0, 100);

  const profile_rating = total === 0 && profiles.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(childrenWithProfileRate, 80) && total > 0)
    strengths.push("Most children have attachment profiles — the home understands relational needs at an individual level");
  if (meets(activeProfileRate, 85) && total > 0)
    strengths.push("Profiles are actively maintained — attachment understanding is kept current and responsive");
  if (meets(behaviourAnalysisRate, 75) && profilesWithBehaviours.length > 0)
    strengths.push("Behaviour analysis links underlying needs to recommended responses — staff can respond therapeutically");
  if (meets(childVoiceRate, 80) && total > 0)
    strengths.push("Children's views are consistently captured in attachment profiles — their relational experience informs care");
  if (meets(staffGuidanceRate, 80) && total > 0)
    strengths.push("Staff guidance is embedded in profiles — carers have clear, attachment-informed strategies for each child");
  if (meets(strongRelationshipRate, 60) && totalRelationships > 0)
    strengths.push("Strong key relationships are well-documented — children's relational security is being actively nurtured");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No attachment profiles exist — the home cannot demonstrate attachment-informed care for any child");
  if (below(childrenWithProfileRate, 50) && total > 0)
    concerns.push("Fewer than half of children have attachment profiles — relational needs may be unrecognised");
  if (below(activeProfileRate, 40) && total > 0)
    concerns.push("Most profiles are not active — attachment understanding may be outdated and ineffective");
  if (below(behaviourAnalysisRate, 25) && profilesWithBehaviours.length > 0)
    concerns.push("Behaviours are recorded without underlying needs or recommended responses — analysis is incomplete");
  if (below(childVoiceRate, 20) && total > 0)
    concerns.push("Children's views are rarely captured in profiles — their relational experience is undocumented");
  if (below(staffGuidanceRate, 20) && total > 0)
    concerns.push("Staff guidance is absent from most profiles — carers lack attachment-informed strategies");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: AttachmentProfileResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Commission attachment assessments for all children and create individual profiles", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 9" });
  if (below(childrenWithProfileRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Extend attachment profiling to all children — prioritise those without any assessment", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" });
  if (below(behaviourAnalysisRate, 50) && profilesWithBehaviours.length > 0)
    recommendations.push({ rank: ++rank, recommendation: "Complete behaviour analysis by linking observed behaviours to underlying attachment needs and recommended responses", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (below(childVoiceRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure each child's views about their relationships and attachment experiences are recorded in their profile", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (below(staffGuidanceRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Add specific staff guidance to profiles so carers can implement attachment-informed responses consistently", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  if (below(pct(withTherapeuticApproach, total), 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Identify and document therapeutic approaches aligned to each child's attachment style", urgency: "planned", regulatory_ref: "CHR 2015 Reg 10" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: AttachmentProfileResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No attachment profiles means Ofsted cannot verify the home provides attachment-informed care", severity: "critical" });
  if (total > 0 && meets(childVoiceRate, 80) && meets(staffGuidanceRate, 80))
    insights.push({ text: "Child voice combined with staff guidance creates a genuinely attachment-informed care environment", severity: "positive" });
  if (total > 0 && meets(behaviourAnalysisRate, 75) && meets(staffGuidanceRate, 80))
    insights.push({ text: "Comprehensive behaviour analysis linked to staff guidance enables therapeutically attuned responses", severity: "positive" });
  const disorganisedCount = profiles.filter(p => p.primary_style === "disorganised").length;
  if (disorganisedCount > 0 && total > 0)
    insights.push({ text: "Children with disorganised attachment require specialist therapeutic input — ensure these profiles are reviewed by qualified professionals", severity: "warning" });
  if (meets(strongRelationshipRate, 60) && totalRelationships > 0)
    insights.push({ text: "Strong key relationships across profiles indicate children are forming secure relational foundations", severity: "positive" });
  const strainedTotal = profiles.reduce((s, p) => s + p.strained_relationship_count, 0);
  if (strainedTotal > 3 && totalRelationships > 0)
    insights.push({ text: "Multiple strained relationships across profiles may indicate systemic relational challenges requiring therapeutic intervention", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (profile_rating === "insufficient_data") {
    headline = "No data available for attachment profile intelligence analysis";
  } else if (profile_rating === "outstanding") {
    headline = "Outstanding attachment profiling — children's relational needs are deeply understood and expertly supported";
  } else if (profile_rating === "good") {
    headline = "Good attachment profiling with clear understanding of children's relational needs";
  } else if (profile_rating === "adequate") {
    headline = "Attachment profiles exist but depth of analysis or coverage needs strengthening";
  } else {
    headline = "Inadequate attachment profiling — children's relational needs are not being systematically understood";
  }

  return {
    profile_rating,
    profile_score: score,
    headline,
    total_profiles: total,
    children_with_profile_rate: childrenWithProfileRate,
    active_profile_rate: activeProfileRate,
    behaviour_analysis_rate: behaviourAnalysisRate,
    strong_relationship_rate: strongRelationshipRate,
    child_voice_rate: childVoiceRate,
    staff_guidance_rate: staffGuidanceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
