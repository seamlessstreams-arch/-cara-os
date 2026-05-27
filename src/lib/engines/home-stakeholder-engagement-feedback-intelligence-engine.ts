// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAKEHOLDER ENGAGEMENT & FEEDBACK INTELLIGENCE ENGINE
// Tracks multi-stakeholder feedback, parent partnership quality, community
// sentiment, and response rates to ensure responsive, accountable care.
// Pure deterministic engine. CHR 2015 Reg 5/44.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StakeholderFeedbackInput {
  id: string;
  date: string;
  source: string;                  // "social_worker" | "parent" | "school" | "health" | "commissioning" | "community" | "visitor" | "irp"
  sentiment: string;               // "positive" | "neutral" | "negative"
  action_taken: boolean;
  responded_to: boolean;
}

export interface ParentPartnershipInput {
  id: string;
  child_id: string;
  date: string;
  engagement_quality: string;      // "strong" | "developing" | "limited" | "none"
  contact_maintained: boolean;
  views_sought: boolean;
}

export interface CommunityFeedbackInput {
  id: string;
  date: string;
  sentiment: string;               // "positive" | "neutral" | "negative"
  responded_to: boolean;
}

export interface StakeholderEngagementInput {
  today: string;
  total_children: number;
  stakeholder_feedback: StakeholderFeedbackInput[];
  parent_partnerships: ParentPartnershipInput[];
  community_feedback: CommunityFeedbackInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StakeholderEngagementRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface StakeholderEngagementResult {
  stakeholder_rating: StakeholderEngagementRating;
  stakeholder_score: number;
  headline: string;
  total_feedback_items: number;
  positive_sentiment_rate: number;
  response_rate: number;
  parent_engagement_rate: number;
  community_sentiment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeStakeholderEngagementFeedback(
  input: StakeholderEngagementInput,
): StakeholderEngagementResult {
  const { total_children, stakeholder_feedback, parent_partnerships, community_feedback } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (total_children === 0) {
    return {
      stakeholder_rating: "insufficient_data",
      stakeholder_score: 0,
      headline: "No children in placement — insufficient data for stakeholder engagement analysis.",
      total_feedback_items: 0,
      positive_sentiment_rate: 0,
      response_rate: 0,
      parent_engagement_rate: 0,
      community_sentiment_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  const totalFeedback = stakeholder_feedback.length + community_feedback.length;

  // Stakeholder positive sentiment
  const positiveStakeholder = stakeholder_feedback.filter(f => f.sentiment === "positive").length;
  const posRate = pct(positiveStakeholder, stakeholder_feedback.length);

  // Response rate across stakeholder feedback
  const respondedStakeholder = stakeholder_feedback.filter(f => f.responded_to).length;
  const responseRate = pct(respondedStakeholder, stakeholder_feedback.length);

  // Parent partnership quality
  const strongOrDeveloping = parent_partnerships.filter(
    p => p.engagement_quality === "strong" || p.engagement_quality === "developing",
  ).length;
  const parentEngagementRate = pct(strongOrDeveloping, parent_partnerships.length);

  // Parent views sought
  const viewsSought = parent_partnerships.filter(p => p.views_sought).length;
  const viewsRate = pct(viewsSought, parent_partnerships.length);

  // Community positive sentiment
  const positiveCommunity = community_feedback.filter(f => f.sentiment === "positive").length;
  const comPosRate = pct(positiveCommunity, community_feedback.length);

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 6 modifiers (max +30) -> max 82, clamp 0-100
  // ═══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Feedback volume (+-4) ───────────────────────────────────
  if (totalFeedback >= 10) score += 4;
  else if (totalFeedback >= 6) score += 2;
  else if (totalFeedback >= 3) score += 0;
  else score -= 4;

  // ── Mod 2: Positive sentiment (+-6) ────────────────────────────────
  if (stakeholder_feedback.length > 0) {
    if (posRate >= 80) score += 6;
    else if (posRate >= 60) score += 3;
    else if (posRate >= 40) score += 0;
    else score -= 6;
  }

  // ── Mod 3: Response rate (+-5) ─────────────────────────────────────
  if (stakeholder_feedback.length > 0) {
    if (responseRate >= 90) score += 5;
    else if (responseRate >= 75) score += 3;
    else if (responseRate >= 50) score += 0;
    else score -= 5;
  }

  // ── Mod 4: Parent partnership quality (+-6) ────────────────────────
  if (parent_partnerships.length > 0) {
    if (parentEngagementRate >= 80) score += 6;
    else if (parentEngagementRate >= 60) score += 3;
    else if (parentEngagementRate >= 40) score += 0;
    else score -= 6;
  } else {
    score -= 1;
  }

  // ── Mod 5: Parent views sought (+-4) ──────────────────────────────
  if (parent_partnerships.length > 0) {
    if (viewsRate >= 90) score += 4;
    else if (viewsRate >= 70) score += 2;
    else if (viewsRate >= 50) score += 0;
    else score -= 4;
  }

  // ── Mod 6: Community sentiment (+-5) ──────────────────────────────
  if (community_feedback.length > 0) {
    if (comPosRate >= 80) score += 5;
    else if (comPosRate >= 60) score += 3;
    else if (comPosRate >= 40) score += 0;
    else score -= 5;
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let stakeholder_rating: StakeholderEngagementRating;
  if (score >= 80) stakeholder_rating = "outstanding";
  else if (score >= 65) stakeholder_rating = "good";
  else if (score >= 45) stakeholder_rating = "adequate";
  else stakeholder_rating = "inadequate";

  // ═══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ═══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: StakeholderEngagementResult["recommendations"] = [];
  const insights: StakeholderEngagementResult["insights"] = [];
  let rank = 0;

  // ── Strengths ───────────────────────────────────────────────────────
  if (stakeholder_feedback.length > 0 && posRate >= 80) {
    strengths.push(`Excellent stakeholder sentiment — ${posRate}% of feedback is positive, reflecting strong confidence in the home's care.`);
  }
  if (stakeholder_feedback.length > 0 && responseRate >= 90) {
    strengths.push(`Outstanding response rate — ${responseRate}% of stakeholder feedback has been responded to, demonstrating accountability.`);
  }
  if (parent_partnerships.length > 0 && parentEngagementRate >= 80) {
    strengths.push(`Strong parent partnerships — ${parentEngagementRate}% rated as strong or developing engagement quality.`);
  }
  if (parent_partnerships.length > 0 && viewsRate >= 90) {
    strengths.push(`Parent views are actively sought — ${viewsRate}% of partnerships have documented views sought from parents.`);
  }
  if (community_feedback.length > 0 && comPosRate >= 80) {
    strengths.push(`Positive community relations — ${comPosRate}% of community feedback is positive, indicating good neighbourhood integration.`);
  }
  if (totalFeedback >= 10) {
    strengths.push(`Robust feedback volume — ${totalFeedback} items of stakeholder and community feedback captured.`);
  }

  // ── Concerns ────────────────────────────────────────────────────────
  if (stakeholder_feedback.length > 0 && posRate < 40) {
    concerns.push(`Low positive sentiment — only ${posRate}% of stakeholder feedback is positive. Significant dissatisfaction among stakeholders.`);
    recommendations.push({ rank: ++rank, recommendation: "Review negative stakeholder feedback themes and develop an action plan to address recurring concerns.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (stakeholder_feedback.length > 0 && responseRate < 50) {
    concerns.push(`Poor response rate — only ${responseRate}% of stakeholder feedback has been responded to. Feedback must be acknowledged and actioned.`);
    recommendations.push({ rank: ++rank, recommendation: "Implement a feedback response tracking system to ensure all stakeholder feedback receives a timely response.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (parent_partnerships.length > 0 && parentEngagementRate < 40) {
    concerns.push(`Weak parent partnerships — only ${parentEngagementRate}% rated as strong or developing. Limited engagement undermines children's family connections.`);
    recommendations.push({ rank: ++rank, recommendation: "Develop a parent engagement strategy to strengthen partnership working with families.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (parent_partnerships.length === 0) {
    concerns.push("No parent partnership records — the home cannot evidence family engagement or partnership working.");
    recommendations.push({ rank: ++rank, recommendation: "Establish parent partnership records for all children to track family engagement quality.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (parent_partnerships.length > 0 && viewsRate < 50) {
    concerns.push(`Parent views under-represented — only ${viewsRate}% of partnerships have views sought from parents. Parents must be consulted.`);
    recommendations.push({ rank: ++rank, recommendation: "Ensure parent views are actively sought and recorded across all parent partnerships.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (community_feedback.length > 0 && comPosRate < 40) {
    concerns.push(`Negative community sentiment — only ${comPosRate}% of community feedback is positive. Neighbourhood relations need attention.`);
    recommendations.push({ rank: ++rank, recommendation: "Engage with the local community to understand and address concerns about the home.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (community_feedback.length === 0) {
    concerns.push("No community feedback recorded — the home cannot evidence community engagement or neighbourhood relations.");
    recommendations.push({ rank: ++rank, recommendation: "Establish mechanisms for capturing community feedback to demonstrate positive neighbourhood integration.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 44" });
  }
  if (totalFeedback < 3) {
    concerns.push(`Very low feedback volume — only ${totalFeedback} item${totalFeedback === 1 ? "" : "s"} of feedback recorded. The home lacks evidence of stakeholder engagement.`);
    recommendations.push({ rank: ++rank, recommendation: "Proactively seek feedback from social workers, parents, schools, health professionals, and commissioning bodies.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  // ── Insights ────────────────────────────────────────────────────────
  if (stakeholder_rating === "outstanding") {
    insights.push({ text: `Stakeholder engagement is outstanding (${score}%). Multi-source feedback is overwhelmingly positive, response rates are exemplary, parent partnerships are strong, and community sentiment is favourable. This evidences excellent Reg 5/44 compliance.`, severity: "positive" });
  }
  if (stakeholder_rating === "inadequate") {
    insights.push({ text: `Stakeholder engagement is inadequate (${score}%). Significant gaps in feedback response, parent partnership quality, or community relations. This is a regulatory concern under CHR 2015 Reg 5/44.`, severity: "critical" });
  }
  if (stakeholder_feedback.length > 0 && posRate >= 80 && responseRate >= 90) {
    insights.push({ text: "The home demonstrates a responsive feedback culture — high positive sentiment combined with near-complete response rates indicates stakeholders feel heard and valued.", severity: "positive" });
  }
  if (parent_partnerships.length > 0 && parentEngagementRate >= 80 && viewsRate >= 90) {
    insights.push({ text: "Parent partnership working is exemplary — strong engagement quality with views actively sought demonstrates child-centred family practice that Ofsted would view favourably.", severity: "positive" });
  }
  if (community_feedback.length > 0 && comPosRate >= 80) {
    insights.push({ text: `Community sentiment is ${comPosRate}% positive — the home is well-integrated into its local area, supporting children's sense of belonging and normality.`, severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (stakeholder_rating === "outstanding") {
    headline = "Stakeholder engagement is outstanding — positive multi-source feedback, responsive practice, strong parent partnerships, and favourable community relations.";
  } else if (stakeholder_rating === "good") {
    headline = "Good stakeholder engagement with positive feedback trends and developing parent partnerships, with some areas for improvement.";
  } else if (stakeholder_rating === "adequate") {
    headline = "Adequate stakeholder engagement but gaps in response rates, parent partnerships, or community sentiment need addressing.";
  } else {
    headline = "Stakeholder engagement is inadequate — significant concerns in feedback response, parent engagement, or community relations require urgent action.";
  }

  return {
    stakeholder_rating,
    stakeholder_score: score,
    headline,
    total_feedback_items: totalFeedback,
    positive_sentiment_rate: posRate,
    response_rate: responseRate,
    parent_engagement_rate: parentEngagementRate,
    community_sentiment_rate: comPosRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
