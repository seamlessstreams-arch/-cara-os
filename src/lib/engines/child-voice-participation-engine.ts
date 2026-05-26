// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD VOICE & PARTICIPATION INTELLIGENCE ENGINE
//
// Home-level engine aggregating how well children's voices are heard and
// represented across the home: LAC review participation, advocacy access,
// key work engagement, feedback mechanisms, and child-led activities.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 7 (the welfare of children), Reg 16 (complaints),
// Reg 45 (independent person reports). SCCIF: "The voice of the child runs
// throughout all evidence."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInfo {
  id: string;
  name: string;
}

export type ParticipationType = "attended" | "represented" | "written_views" | "did_not_participate" | "declined";

export interface LacReviewInput {
  id: string;
  child_id: string;
  date: string;
  child_participation: ParticipationType;
  child_views_recorded: boolean;
  iro_name: string;
}

export interface AdvocacyInput {
  id: string;
  child_id: string;
  status: string;            // active, completed, declined
  provider: string;
  referral_date: string;
  visits_count: number;
  issues_raised: string[];
  private_sessions: number;
}

export interface KeyWorkSessionInput {
  id: string;
  child_id: string;
  date: string;
  child_engaged: boolean;
  child_views_captured: boolean;
  themes: string[];
}

export interface FeedbackEntryInput {
  id: string;
  child_id: string;
  date: string;
  type: string;              // complaint, compliment, suggestion, concern
  status: string;            // open, resolved, acknowledged
  response_given: boolean;
  response_within_target: boolean;
}

export interface ChildVoiceParticipationInput {
  today: string;
  children: ChildInfo[];
  lac_reviews: LacReviewInput[];
  advocacy_records: AdvocacyInput[];
  key_work_sessions: KeyWorkSessionInput[];
  feedback_entries: FeedbackEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type VoiceHealth = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface ReviewParticipation {
  total_reviews_90d: number;
  attended_count: number;
  represented_count: number;
  written_views_count: number;
  declined_count: number;
  did_not_participate_count: number;
  participation_rate: number;     // 0-100 (attended + represented + written)
  views_recorded_rate: number;    // 0-100
}

export interface AdvocacyOverview {
  children_with_advocacy: number;
  active_referrals: number;
  completed_referrals: number;
  total_visits_90d: number;
  private_sessions_count: number;
  top_issues: { issue: string; count: number }[];
}

export interface KeyWorkEngagement {
  total_sessions_30d: number;
  engagement_rate: number;        // 0-100 (child_engaged / total)
  views_capture_rate: number;     // 0-100
  top_themes: { theme: string; count: number }[];
}

export interface FeedbackAnalysis {
  total_90d: number;
  complaints: number;
  compliments: number;
  suggestions: number;
  response_rate: number;          // 0-100
  response_within_target_rate: number; // 0-100
  open_count: number;
}

export interface ChildVoiceProfile {
  child_id: string;
  child_name: string;
  review_participated: boolean;
  has_advocacy: boolean;
  key_work_sessions_30d: number;
  feedback_given: boolean;
  voice_score: number;            // 0-100
  flags: string[];
}

export interface VoiceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface VoiceInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildVoiceParticipationResult {
  generated_at: string;
  voice_health: VoiceHealth;
  voice_score: number;            // 0-100
  headline: string;
  review_participation: ReviewParticipation;
  advocacy_overview: AdvocacyOverview;
  key_work_engagement: KeyWorkEngagement;
  feedback_analysis: FeedbackAnalysis;
  child_profiles: ChildVoiceProfile[];
  strengths: string[];
  concerns: string[];
  recommendations: VoiceRecommendation[];
  insights: VoiceInsight[];
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
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildVoiceParticipation(
  input: ChildVoiceParticipationInput,
): ChildVoiceParticipationResult {
  const { today, children, lac_reviews, advocacy_records, key_work_sessions, feedback_entries } = input;

  // ── Review Participation ──────────────────────────────────────────────
  const reviews90d = lac_reviews.filter((r) => isWithin(today, r.date, 90));
  const attendedCount = reviews90d.filter((r) => r.child_participation === "attended").length;
  const representedCount = reviews90d.filter((r) => r.child_participation === "represented").length;
  const writtenCount = reviews90d.filter((r) => r.child_participation === "written_views").length;
  const declinedCount = reviews90d.filter((r) => r.child_participation === "declined").length;
  const noPartCount = reviews90d.filter((r) => r.child_participation === "did_not_participate").length;
  const participatingCount = attendedCount + representedCount + writtenCount;
  const viewsRecorded = reviews90d.filter((r) => r.child_views_recorded).length;

  const review_participation: ReviewParticipation = {
    total_reviews_90d: reviews90d.length,
    attended_count: attendedCount,
    represented_count: representedCount,
    written_views_count: writtenCount,
    declined_count: declinedCount,
    did_not_participate_count: noPartCount,
    participation_rate: pct(participatingCount, reviews90d.length),
    views_recorded_rate: pct(viewsRecorded, reviews90d.length),
  };

  // ── Advocacy Overview ─────────────────────────────────────────────────
  const activeAdvocacy = advocacy_records.filter((a) => a.status === "active");
  const completedAdvocacy = advocacy_records.filter((a) => a.status === "completed");
  const childrenWithAdvocacy = new Set(advocacy_records.filter((a) => a.status === "active" || a.status === "completed").map((a) => a.child_id)).size;
  const advocacyVisits90d = advocacy_records
    .filter((a) => isWithin(today, a.referral_date, 90))
    .reduce((s, a) => s + a.visits_count, 0);
  const privateSessions = advocacy_records.reduce((s, a) => s + a.private_sessions, 0);

  const issueCounts: Record<string, number> = {};
  advocacy_records.forEach((a) =>
    a.issues_raised.forEach((issue) => {
      issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
    }),
  );
  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  const advocacy_overview: AdvocacyOverview = {
    children_with_advocacy: childrenWithAdvocacy,
    active_referrals: activeAdvocacy.length,
    completed_referrals: completedAdvocacy.length,
    total_visits_90d: advocacyVisits90d,
    private_sessions_count: privateSessions,
    top_issues: topIssues,
  };

  // ── Key Work Engagement ───────────────────────────────────────────────
  const kw30d = key_work_sessions.filter((k) => isWithin(today, k.date, 30));
  const kwEngaged = kw30d.filter((k) => k.child_engaged).length;
  const kwViewsCaptured = kw30d.filter((k) => k.child_views_captured).length;

  const themeCounts: Record<string, number> = {};
  kw30d.forEach((k) =>
    k.themes.forEach((t) => {
      themeCounts[t] = (themeCounts[t] ?? 0) + 1;
    }),
  );
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  const key_work_engagement: KeyWorkEngagement = {
    total_sessions_30d: kw30d.length,
    engagement_rate: pct(kwEngaged, kw30d.length),
    views_capture_rate: pct(kwViewsCaptured, kw30d.length),
    top_themes: topThemes,
  };

  // ── Feedback Analysis ─────────────────────────────────────────────────
  const fb90d = feedback_entries.filter((f) => isWithin(today, f.date, 90));
  const complaints = fb90d.filter((f) => f.type === "complaint").length;
  const compliments = fb90d.filter((f) => f.type === "compliment").length;
  const suggestions = fb90d.filter((f) => f.type === "suggestion").length;
  const responded = fb90d.filter((f) => f.response_given).length;
  const withinTarget = fb90d.filter((f) => f.response_within_target).length;
  const openFeedback = fb90d.filter((f) => f.status === "open").length;

  const feedback_analysis: FeedbackAnalysis = {
    total_90d: fb90d.length,
    complaints,
    compliments,
    suggestions,
    response_rate: pct(responded, fb90d.length),
    response_within_target_rate: pct(withinTarget, fb90d.length),
    open_count: openFeedback,
  };

  // ── Per-Child Voice Profiles ──────────────────────────────────────────
  const child_profiles: ChildVoiceProfile[] = children.map((c) => {
    const childReviews = reviews90d.filter((r) => r.child_id === c.id);
    const participated = childReviews.some((r) =>
      r.child_participation === "attended" || r.child_participation === "represented" || r.child_participation === "written_views",
    );
    const hasAdvocacy = advocacy_records.some((a) => a.child_id === c.id && (a.status === "active" || a.status === "completed"));
    const kwSessions = kw30d.filter((k) => k.child_id === c.id);
    const hasFeedback = fb90d.some((f) => f.child_id === c.id);

    // Per-child voice score
    let cs = 0;
    if (participated) cs += 30;
    else if (childReviews.length > 0) cs += 5; // At least had a review
    if (hasAdvocacy) cs += 20;
    if (kwSessions.length >= 2) cs += 25;
    else if (kwSessions.length === 1) cs += 15;
    if (hasFeedback) cs += 15;
    if (kwSessions.some((k) => k.child_views_captured)) cs += 10;

    const flags: string[] = [];
    if (!participated && childReviews.length > 0) flags.push("Did not participate in LAC review");
    if (childReviews.some((r) => r.child_participation === "did_not_participate")) flags.push("No participation in review — voice not heard");
    if (kwSessions.length === 0) flags.push("No key work sessions in 30 days");
    if (!hasAdvocacy && childReviews.some((r) => r.child_participation === "did_not_participate")) flags.push("Consider advocacy referral");

    return {
      child_id: c.id,
      child_name: c.name,
      review_participated: participated,
      has_advocacy: hasAdvocacy,
      key_work_sessions_30d: kwSessions.length,
      feedback_given: hasFeedback,
      voice_score: clamp(cs, 0, 100),
      flags,
    };
  }).sort((a, b) => a.voice_score - b.voice_score); // Lowest voice first

  // ── Composite Voice Score (0-100) ─────────────────────────────────────
  let score = 50;

  // Review participation
  if (review_participation.participation_rate === 100 && reviews90d.length > 0) score += 10;
  else if (review_participation.participation_rate >= 80) score += 5;
  else if (review_participation.participation_rate < 50 && reviews90d.length > 0) score -= 10;

  if (review_participation.views_recorded_rate === 100 && reviews90d.length > 0) score += 5;
  else if (review_participation.views_recorded_rate < 80 && reviews90d.length > 0) score -= 5;

  // Advocacy
  if (childrenWithAdvocacy > 0) score += 5;
  if (privateSessions >= 3) score += 3;

  // Key work
  if (key_work_engagement.engagement_rate >= 80 && kw30d.length >= 3) score += 10;
  else if (key_work_engagement.engagement_rate >= 60) score += 5;
  else if (kw30d.length < 2 && children.length > 0) score -= 5;

  if (key_work_engagement.views_capture_rate >= 80 && kw30d.length >= 3) score += 5;

  // Feedback
  if (fb90d.length > 0) score += 3;
  if (feedback_analysis.response_rate === 100 && fb90d.length > 0) score += 5;
  else if (feedback_analysis.response_rate < 80 && fb90d.length >= 2) score -= 3;
  if (openFeedback > 0) score -= 2;

  // Children without voice
  const silentChildren = child_profiles.filter((p) => p.voice_score < 20);
  if (silentChildren.length > 0) score -= silentChildren.length * 3;

  score = clamp(Math.round(score), 0, 100);

  const voice_health: VoiceHealth =
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "requires_improvement" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Child voice health is ${voice_health}`);
  if (reviews90d.length > 0) parts.push(`${review_participation.participation_rate}% LAC review participation`);
  if (childrenWithAdvocacy > 0) parts.push(`${childrenWithAdvocacy} child${childrenWithAdvocacy !== 1 ? "ren" : ""} with advocacy`);
  if (kw30d.length > 0) parts.push(`${kw30d.length} key work sessions in 30d`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (review_participation.participation_rate === 100 && reviews90d.length >= 2) {
    strengths.push(`100% LAC review participation across ${reviews90d.length} reviews — every child's voice is heard in their statutory review (Reg 7).`);
  }

  if (review_participation.views_recorded_rate === 100 && reviews90d.length >= 2) {
    strengths.push("Child views recorded in 100% of LAC reviews — robust documentation of wishes and feelings.");
  }

  if (childrenWithAdvocacy >= Math.ceil(children.length * 0.5) && children.length > 0) {
    strengths.push(`${childrenWithAdvocacy} of ${children.length} children have accessed advocacy — demonstrating proactive support for children to express their views independently.`);
  }

  if (privateSessions >= 3) {
    strengths.push("Multiple private advocacy sessions evidenced — children have confidential access to independent support.");
  }

  if (key_work_engagement.engagement_rate >= 80 && kw30d.length >= 5) {
    strengths.push(`${key_work_engagement.engagement_rate}% key work engagement rate across ${kw30d.length} sessions — children are actively participating in their own support.`);
  }

  if (key_work_engagement.views_capture_rate >= 80 && kw30d.length >= 3) {
    strengths.push("Child views captured in 80%+ of key work sessions — evidencing that children's perspectives inform daily care practice.");
  }

  if (feedback_analysis.response_rate === 100 && fb90d.length >= 2) {
    strengths.push(`All ${fb90d.length} pieces of child feedback responded to — children see that their voice leads to action.`);
  }

  if (compliments > 0) {
    strengths.push(`${compliments} compliment${compliments !== 1 ? "s" : ""} received from children — positive feedback evidences good care relationships.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (review_participation.participation_rate < 50 && reviews90d.length >= 2) {
    concerns.push(`Only ${review_participation.participation_rate}% LAC review participation — children must be supported to participate in their reviews. Ofsted will scrutinise this (Reg 7).`);
  }

  if (noPartCount > 0) {
    concerns.push(`${noPartCount} review${noPartCount !== 1 ? "s" : ""} where children did not participate — investigate barriers and ensure alternative ways of contributing are offered.`);
  }

  if (review_participation.views_recorded_rate < 80 && reviews90d.length >= 2) {
    concerns.push(`Child views recorded in only ${review_participation.views_recorded_rate}% of reviews — wishes and feelings must be documented even when children don't attend.`);
  }

  if (childrenWithAdvocacy === 0 && children.length > 0) {
    concerns.push("No children currently have advocacy access — all children should know how to access an independent advocate (Reg 45).");
  }

  if (key_work_engagement.engagement_rate < 50 && kw30d.length >= 3) {
    concerns.push(`Key work engagement rate at ${key_work_engagement.engagement_rate}% — low engagement may indicate relationship difficulties or session quality issues.`);
  }

  if (kw30d.length < children.length && children.length > 0) {
    concerns.push(`Only ${kw30d.length} key work sessions for ${children.length} children in 30 days — every child should have regular 1:1 time with their key worker.`);
  }

  if (openFeedback >= 2) {
    concerns.push(`${openFeedback} unresolved pieces of child feedback — delayed responses undermine children's confidence that their voice matters.`);
  }

  if (feedback_analysis.response_rate < 80 && fb90d.length >= 2) {
    concerns.push(`Feedback response rate at ${feedback_analysis.response_rate}% — all feedback must receive a timely, meaningful response.`);
  }

  if (silentChildren.length > 0) {
    const names = silentChildren.map((c) => c.child_name).join(", ");
    concerns.push(`${silentChildren.length} child${silentChildren.length !== 1 ? "ren" : ""} with very low voice score: ${names}. Their views may be going unheard — prioritise engagement.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: VoiceRecommendation[] = [];
  let rank = 0;

  if (noPartCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review the reasons children didn't participate in LAC reviews. Offer alternatives: video message, written statement, advocate attendance, or creative expression. Every child has a right to be heard.",
      urgency: "immediate",
      domain: "reviews",
      regulatory_ref: "Reg 7",
    });
  }

  if (childrenWithAdvocacy === 0 && children.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all children know how to access independent advocacy. Display advocacy information, introduce the advocacy service during key work, and make referrals proactively.",
      urgency: "soon",
      domain: "advocacy",
      regulatory_ref: "Reg 45",
    });
  }

  if (silentChildren.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Prioritise voice engagement for ${silentChildren.map((c) => c.child_name).join(", ")}. Consider creative methods: art, music, digital media, or trusted adult outside the home.`,
      urgency: "soon",
      domain: "engagement",
      regulatory_ref: "Reg 7",
    });
  }

  if (openFeedback >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Resolve ${openFeedback} outstanding pieces of child feedback. Close the loop with each child — acknowledge, explain action taken, and ask if they're satisfied.`,
      urgency: "soon",
      domain: "feedback",
      regulatory_ref: "Reg 16",
    });
  }

  if (key_work_engagement.engagement_rate < 50 && kw30d.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review key work approach — low engagement suggests sessions may not be meeting children's needs. Consider changing timing, format, or venue. Ask children what works for them.",
      urgency: "planned",
      domain: "key_work",
      regulatory_ref: "Reg 7",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: VoiceInsight[] = [];

  if (voice_health === "inadequate") {
    insights.push({
      severity: "critical",
      text: "Child voice health is inadequate. Ofsted's SCCIF framework states that 'the voice of the child runs through all evidence' — inspectors will expect to see children actively participating in reviews, accessing advocacy, and shaping their care. Urgent action needed across multiple domains.",
    });
  }

  if (silentChildren.length >= 2) {
    insights.push({
      severity: "critical",
      text: `${silentChildren.length} children have minimal voice engagement. These children may be experiencing barriers to participation — trauma, language, trust, or cultural factors. A targeted approach for each child is essential.`,
    });
  }

  if (noPartCount >= 2 && childrenWithAdvocacy === 0) {
    insights.push({
      severity: "warning",
      text: "Multiple children not participating in reviews AND no advocacy in place. This combination signals that children's right to be heard is not being effectively upheld. Consider emergency advocacy referrals.",
    });
  }

  if (voice_health === "outstanding") {
    insights.push({
      severity: "positive",
      text: "Child voice health is outstanding. Children are actively participating in reviews, accessing advocacy, engaging in key work, and providing feedback that shapes their care. This is exactly what inspectors look for — 'the voice of the child runs through all evidence.'",
    });
  }

  if (review_participation.participation_rate === 100 && key_work_engagement.engagement_rate >= 80 && reviews90d.length > 0 && kw30d.length >= 3) {
    insights.push({
      severity: "positive",
      text: "Excellent participation across reviews and key work. Children are consistently heard in both formal and informal settings — this dual-track approach demonstrates genuine commitment to child-centred practice.",
    });
  }

  if (complaints > 0 && feedback_analysis.response_rate === 100) {
    insights.push({
      severity: "positive",
      text: `All ${complaints} complaint${complaints !== 1 ? "s" : ""} have been responded to. The fact that children feel safe enough to complain, and receive a response, is a positive indicator of care culture.`,
    });
  }

  return {
    generated_at: today,
    voice_health,
    voice_score: score,
    headline,
    review_participation,
    advocacy_overview,
    key_work_engagement,
    feedback_analysis,
    child_profiles,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
