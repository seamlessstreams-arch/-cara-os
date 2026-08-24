// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PARENT/FAMILY PARTNERSHIP ENGAGEMENT INTELLIGENCE ENGINE
// Pure deterministic engine: contact frequency, engagement quality, positive
// outcomes, information sharing, and family relationship breadth.
// CHR 2015 Reg 7: "The children's wishes and feelings standard." SCCIF: Family.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ParentContactInput {
  id: string;
  child_id: string;
  relationship_type: string; // "birth_parent"|"grandparent"|"sibling"|"extended_family"|"foster_carer"|"other"
  contact_type: string; // "phone_call"|"visit"|"email"|"meeting"|"letter"|"video_call"
  engagement_level: string; // "positive"|"neutral"|"difficult"|"disengaged"|"hostile"
  positive_outcomes_count: number;
  follow_up_actions_count: number;
  sw_informed: boolean;
  has_concerns: boolean;
}

export interface ParentPartnershipInput {
  today: string;
  total_children: number;
  contacts: ParentContactInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ParentPartnershipRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ParentPartnershipResult {
  partnership_rating: ParentPartnershipRating;
  partnership_score: number;
  headline: string;
  total_contacts: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positive_engagement_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  children_with_contact_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  sw_informed_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  positive_outcome_rate: number | null;
  contact_type_variety: number;
  relationship_variety: number;
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

function toRating(score: number): ParentPartnershipRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeParentPartnershipEngagement(
  input: ParentPartnershipInput,
): ParentPartnershipResult {
  const { contacts, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      partnership_rating: "insufficient_data",
      partnership_score: 0,
      headline: "No data available for parent partnership analysis",
      total_contacts: 0,
      positive_engagement_rate: 0,
      children_with_contact_rate: 0,
      sw_informed_rate: 0,
      positive_outcome_rate: 0,
      contact_type_variety: 0,
      relationship_variety: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = contacts.length;

  const positive = contacts.filter(c => c.engagement_level === "positive").length;
  const positiveEngagementRate = rate(positive, total);

  const uniqueChildren = new Set(contacts.map(c => c.child_id)).size;
  const childrenContactRate = rate(uniqueChildren, total_children);

  const withSW = contacts.filter(c => c.sw_informed).length;
  const swInformedRate = rate(withSW, total);

  const withPositiveOutcomes = contacts.filter(c => c.positive_outcomes_count > 0).length;
  const positiveOutcomeRate = rate(withPositiveOutcomes, total);

  const uniqueContactTypes = new Set(contacts.map(c => c.contact_type)).size;
  const uniqueRelationships = new Set(contacts.map(c => c.relationship_type)).size;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Positive engagement rate
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(positiveEngagementRate, 70)) score += 5;
    else if (meets(positiveEngagementRate, 40)) score += 2;
    else if (below(positiveEngagementRate, 20)) score -= 5;
  }

  // Modifier 2: Children with contact (coverage)
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(childrenContactRate, 90)) score += 6;
    else if (meets(childrenContactRate, 60)) score += 2;
    else if (below(childrenContactRate, 40)) score -= 5;
  }

  // Modifier 3: Social worker informed rate
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(swInformedRate, 80)) score += 5;
    else if (meets(swInformedRate, 50)) score += 2;
    else if (below(swInformedRate, 30)) score -= 4;
  }

  // Modifier 4: Positive outcomes documented
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(positiveOutcomeRate, 70)) score += 5;
    else if (meets(positiveOutcomeRate, 40)) score += 2;
    else if (below(positiveOutcomeRate, 20)) score -= 4;
  }

  // Modifier 5: Contact type variety
  if (total === 0) {
    score -= 1;
  } else {
    if (uniqueContactTypes >= 4) score += 4;
    else if (uniqueContactTypes >= 2) score += 1;
    else if (uniqueContactTypes <= 1) score -= 4;
  }

  // Modifier 6: Relationship variety
  if (total === 0) {
    score -= 2;
  } else {
    if (uniqueRelationships >= 3) score += 5;
    else if (uniqueRelationships >= 2) score += 2;
    else if (uniqueRelationships <= 1) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Parent and family partnership is proactive, positive and central to each child's care";
      break;
    case "good":
      headline = "Good family engagement with positive relationships and effective communication";
      break;
    case "adequate":
      headline = "Family contact exists but engagement quality and coverage need strengthening";
      break;
    case "inadequate":
      headline = "Parent partnership practice is inadequate — children's family connections are not being supported";
      break;
    default:
      headline = "No data available for parent partnership analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(positiveEngagementRate, 70) && total > 0) strengths.push("Family engagement is overwhelmingly positive — relationships are constructive and supportive");
  if (meets(childrenContactRate, 90) && total > 0) strengths.push("All children maintain meaningful family connections through regular contact");
  if (meets(swInformedRate, 80) && total > 0) strengths.push("Social workers are consistently informed about family contact — strong multi-agency communication");
  if (meets(positiveOutcomeRate, 70) && total > 0) strengths.push("Family contacts regularly produce positive outcomes for children");
  if (uniqueContactTypes >= 4 && total > 0) strengths.push("Diverse contact methods are used — phone, visits, video calls and meetings");
  if (uniqueRelationships >= 3 && total > 0) strengths.push("Children maintain connections across a broad family network — not just parents");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No family contact records — children may be isolated from their families");
  if (below(positiveEngagementRate, 20) && total > 0) concerns.push("Very few family contacts are positive — relationships are strained or difficult");
  if (below(childrenContactRate, 40) && total > 0) concerns.push("Most children have no recorded family contact — connections are not being maintained");
  if (below(swInformedRate, 30) && total > 0) concerns.push("Social workers are rarely informed about family contact — safeguarding oversight is weak");
  if (below(positiveOutcomeRate, 20) && total > 0) concerns.push("Family contacts rarely produce positive outcomes — intervention and support are needed");
  if (uniqueRelationships <= 1 && total > 0) concerns.push("Contact is limited to one relationship type — broader family connections should be explored");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: ParentPartnershipResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Develop a family contact and partnership plan for every child", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (below(childrenContactRate, 60) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Extend family contact support to all children including those with complex family dynamics", urgency: "soon", regulatory_ref: "SCCIF Family" });
  }
  if (below(positiveEngagementRate, 40) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement family mediation and relationship-building strategies to improve engagement quality", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (below(swInformedRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure social workers are informed of all family contacts as standard practice", urgency: "immediate", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (uniqueContactTypes < 2 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Diversify contact methods to include visits, video calls and supervised meetings", urgency: "planned", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (uniqueRelationships < 2 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Explore broader family network connections including grandparents and siblings", urgency: "planned", regulatory_ref: "SCCIF Family" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: ParentPartnershipResult["insights"] = [];

  if (meets(positiveEngagementRate, 70) && meets(childrenContactRate, 90) && meets(swInformedRate, 80) && total >= 10) {
    insights.push({ text: "Family partnership is exemplary — children are connected, families are supported and professionals are informed", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No family contact records means Ofsted cannot verify how children's family relationships are supported", severity: "critical" });
  }
  if (below(positiveEngagementRate, 20) && total > 0) {
    insights.push({ text: "Predominantly negative family engagement suggests children may be distressed by contact — review care plans", severity: "warning" });
  }
  if (meets(childrenContactRate, 90) && total > 0) {
    insights.push({ text: "Every child has family contact — the home prioritises maintaining connections that matter to children", severity: "positive" });
  }
  if (uniqueRelationships >= 3 && total > 0) {
    insights.push({ text: "Broad family network engagement shows children are connected to their wider identity and heritage", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    partnership_rating: rating,
    partnership_score: score,
    headline,
    total_contacts: total,
    positive_engagement_rate: positiveEngagementRate,
    children_with_contact_rate: childrenContactRate,
    sw_informed_rate: swInformedRate,
    positive_outcome_rate: positiveOutcomeRate,
    contact_type_variety: uniqueContactTypes,
    relationship_variety: uniqueRelationships,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
