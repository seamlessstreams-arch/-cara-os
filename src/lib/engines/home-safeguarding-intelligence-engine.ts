// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAFEGUARDING INTELLIGENCE ENGINE
// Home-level: synthesises contextual safeguarding risks, exploitation
// screenings, and online safety incidents to assess safeguarding quality,
// multi-agency engagement, and risk management effectiveness.
// CHR 2015 Reg 12, 13, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ContextualRiskInput {
  id: string;
  date_identified: string;
  risk_level: string;                        // low | medium | high | very_high
  status: string;                            // active | monitoring | resolved | escalated
  children_affected_count: number;
  has_protective_actions: boolean;
  has_multi_agency_actions: boolean;
  review_date: string;
  last_reviewed: string;
}

export interface ExploitationScreeningInput {
  id: string;
  date: string;
  child_id: string;
  risk_level: string;                        // low | medium | high | very_high
  previous_risk_level: string | null;
  status: string;                            // initial_screening | monitoring | referred | closed | etc.
  has_safety_plan: boolean;
  multi_agency_count: number;
  nrm_referral: boolean;
  social_worker_notified: boolean;
  review_date: string;
}

export interface OnlineSafetyInput {
  id: string;
  date: string;
  child_id: string;
  severity: string;                          // low | medium | high | critical
  status: string;                            // open | monitoring | resolved | escalated
  has_safeguarding_referral: boolean;
  has_child_discussion: boolean;
  has_follow_up: boolean;
  parent_notified: boolean;
}

export interface HomeSafeguardingInput {
  today: string;
  total_children: number;
  child_ids: string[];
  contextual_risks: ContextualRiskInput[];
  exploitation_screenings: ExploitationScreeningInput[];
  online_safety_incidents: OnlineSafetyInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SafeguardingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ContextualRiskProfile {
  total_risks: number;
  active_count: number;
  escalated_count: number;
  high_very_high_count: number;
  overdue_reviews: number;
  multi_agency_rate: number;
  protective_action_rate: number;
}

export interface ExploitationProfile {
  total_screenings: number;
  children_screened: string[];
  children_not_screened: string[];
  screening_coverage: number;
  high_risk_count: number;
  safety_plan_rate: number;
  social_worker_notification_rate: number;
  nrm_referral_count: number;
  avg_multi_agency: number;
}

export interface OnlineSafetyProfile {
  total_incidents_90d: number;
  high_critical_count: number;
  unresolved_high_critical: number;
  child_discussion_rate: number;
  follow_up_rate: number;
  parent_notification_rate: number;
  children_affected: string[];
}

export interface SafeguardingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SafeguardingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeSafeguardingResult {
  safeguarding_rating: SafeguardingRating;
  safeguarding_score: number;
  headline: string;
  contextual_risk_profile: ContextualRiskProfile;
  exploitation_profile: ExploitationProfile;
  online_safety_profile: OnlineSafetyProfile;
  strengths: string[];
  concerns: string[];
  recommendations: SafeguardingRecommendation[];
  insights: SafeguardingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SafeguardingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeSafeguarding(
  input: HomeSafeguardingInput,
): HomeSafeguardingResult {
  const { today, child_ids, total_children, contextual_risks, exploitation_screenings, online_safety_incidents } = input;

  const online90d = online_safety_incidents.filter(o => daysBetween(o.date, today) <= 90);

  // Latest exploitation screening per child
  const latestScreenByChild = new Map<string, ExploitationScreeningInput>();
  for (const s of exploitation_screenings) {
    const existing = latestScreenByChild.get(s.child_id);
    if (!existing || s.date > existing.date) {
      latestScreenByChild.set(s.child_id, s);
    }
  }
  const latestScreenings = [...latestScreenByChild.values()];

  // Insufficient data
  if (contextual_risks.length === 0 && latestScreenings.length === 0 && online90d.length === 0) {
    return {
      safeguarding_rating: "insufficient_data",
      safeguarding_score: 0,
      headline: "No safeguarding assessment data available.",
      contextual_risk_profile: emptyCtxProfile(),
      exploitation_profile: emptyExpProfile(child_ids),
      online_safety_profile: emptyOnlineProfile(),
      strengths: [],
      concerns: ["No contextual safeguarding, exploitation screening, or online safety data found."],
      recommendations: [{ rank: 1, recommendation: "Complete exploitation screenings for all children and conduct a contextual safeguarding assessment.", urgency: "immediate", regulatory_ref: "Reg 12" }],
      insights: [{ text: "No safeguarding intelligence data exists. Ofsted expects proactive safeguarding assessment including exploitation screening and contextual risk mapping.", severity: "critical" }],
    };
  }

  // ── Contextual Risk Profile ─────────────────────────────────────────
  const activeRisks = contextual_risks.filter(r => r.status === "active" || r.status === "escalated");
  const escalatedRisks = contextual_risks.filter(r => r.status === "escalated");
  const highVeryHigh = activeRisks.filter(r => r.risk_level === "high" || r.risk_level === "very_high");

  const overdueReviews = activeRisks.filter(r => r.review_date < today).length;

  const withMultiAgency = contextual_risks.filter(r => r.has_multi_agency_actions).length;
  const multiAgencyRate = pct(withMultiAgency, contextual_risks.length);

  const withProtective = activeRisks.filter(r => r.has_protective_actions).length;
  const protectiveRate = pct(withProtective, activeRisks.length);

  const ctxProfile: ContextualRiskProfile = {
    total_risks: contextual_risks.length,
    active_count: activeRisks.length,
    escalated_count: escalatedRisks.length,
    high_very_high_count: highVeryHigh.length,
    overdue_reviews: overdueReviews,
    multi_agency_rate: multiAgencyRate,
    protective_action_rate: protectiveRate,
  };

  // ── Exploitation Profile ────────────────────────────────────────────
  const childrenScreened = [...new Set(latestScreenings.map(s => s.child_id))];
  const childrenNotScreened = child_ids.filter(id => !childrenScreened.includes(id));
  const screenCoverage = total_children > 0 ? pct(childrenScreened.length, total_children) : 0;

  const highRiskScreenings = latestScreenings.filter(s => s.risk_level === "high" || s.risk_level === "very_high");
  const withSafetyPlan = highRiskScreenings.filter(s => s.has_safety_plan).length;
  const safetyPlanRate = pct(withSafetyPlan, highRiskScreenings.length);

  const swNotified = latestScreenings.filter(s => s.social_worker_notified).length;
  const swNotificationRate = pct(swNotified, latestScreenings.length);

  const nrmCount = latestScreenings.filter(s => s.nrm_referral).length;

  const multiAgencyCounts = latestScreenings.map(s => s.multi_agency_count);
  const avgMultiAgency = multiAgencyCounts.length > 0
    ? Math.round((multiAgencyCounts.reduce((a, b) => a + b, 0) / multiAgencyCounts.length) * 10) / 10
    : 0;

  const expProfile: ExploitationProfile = {
    total_screenings: latestScreenings.length,
    children_screened: childrenScreened,
    children_not_screened: childrenNotScreened,
    screening_coverage: screenCoverage,
    high_risk_count: highRiskScreenings.length,
    safety_plan_rate: safetyPlanRate,
    social_worker_notification_rate: swNotificationRate,
    nrm_referral_count: nrmCount,
    avg_multi_agency: avgMultiAgency,
  };

  // ── Online Safety Profile ───────────────────────────────────────────
  const onlineHighCritical = online90d.filter(o => o.severity === "high" || o.severity === "critical");
  const unresolvedHC = onlineHighCritical.filter(o => o.status !== "resolved").length;

  const withDiscussion = online90d.filter(o => o.has_child_discussion).length;
  const discussionRate = pct(withDiscussion, online90d.length);

  const withFollowUp = online90d.filter(o => o.has_follow_up).length;
  const followUpRate = pct(withFollowUp, online90d.length);

  const parentNotified = online90d.filter(o => o.parent_notified).length;
  const parentRate = pct(parentNotified, online90d.length);

  const onlineChildren = [...new Set(online90d.map(o => o.child_id))];

  const onlineProfile: OnlineSafetyProfile = {
    total_incidents_90d: online90d.length,
    high_critical_count: onlineHighCritical.length,
    unresolved_high_critical: unresolvedHC,
    child_discussion_rate: discussionRate,
    follow_up_rate: followUpRate,
    parent_notification_rate: parentRate,
    children_affected: onlineChildren,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // 1. Active high/very_high contextual risks (±5)
  if (highVeryHigh.length === 0) score += 5;
  else if (highVeryHigh.length <= 2) score += 2;
  else score -= 4;

  // 2. Overdue reviews (±4)
  if (overdueReviews === 0) score += 4;
  else if (overdueReviews <= 2) score += 1;
  else score -= 4;

  // 3. Multi-agency engagement (±4)
  if (contextual_risks.length > 0) {
    if (multiAgencyRate >= 80) score += 4;
    else if (multiAgencyRate >= 60) score += 2;
    else score -= 3;
  }

  // 4. Exploitation screening coverage (±5)
  if (screenCoverage >= 80) score += 5;
  else if (screenCoverage >= 60) score += 3;
  else if (latestScreenings.length > 0) score -= 3;

  // 5. High-risk management — safety plans (±4)
  if (highRiskScreenings.length === 0) score += 4; // no high risk = good
  else if (safetyPlanRate === 100) score += 4;
  else score -= 3;

  // 6. Social worker notification (±3)
  if (latestScreenings.length > 0) {
    if (swNotificationRate >= 80) score += 3;
    else score -= 2;
  }

  // 7. Online safety — unresolved high/critical (±3)
  if (online90d.length > 0) {
    if (unresolvedHC === 0) score += 3;
    else score -= 3;
  }

  // 8. Online — child discussion + follow-up (±3)
  if (online90d.length > 0) {
    if (discussionRate >= 80 && followUpRate >= 80) score += 3;
    else if (discussionRate >= 60 || followUpRate >= 60) score += 1;
    else score -= 2;
  }

  // 9. Protective actions on active risks (±3)
  if (activeRisks.length > 0) {
    if (protectiveRate >= 80) score += 3;
    else score -= 2;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (highVeryHigh.length === 0 && contextual_risks.length > 0) strengths.push("No active high or very high contextual safeguarding risks — the home environment is effectively managed.");
  if (screenCoverage >= 80) strengths.push(`Exploitation screening coverage is ${screenCoverage}% — proactive risk identification across the home.`);
  if (multiAgencyRate >= 80 && contextual_risks.length > 0) strengths.push(`Multi-agency engagement on ${multiAgencyRate}% of contextual risks — strong partnership working.`);
  if (safetyPlanRate === 100 && highRiskScreenings.length > 0) strengths.push("All high-risk children have safety plans in place — robust protective measures.");
  if (unresolvedHC === 0 && online90d.length > 0) strengths.push("All high/critical online safety incidents resolved — effective digital safeguarding response.");
  if (discussionRate >= 80 && online90d.length > 0) strengths.push(`Child discussions conducted after ${discussionRate}% of online incidents — children are supported to understand risks.`);
  if (overdueReviews === 0 && activeRisks.length > 0) strengths.push("All active contextual risk reviews are current — management oversight is timely.");
  if (protectiveRate >= 80 && activeRisks.length > 0) strengths.push(`Protective actions in place for ${protectiveRate}% of active risks — risks are being actively managed.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (highVeryHigh.length > 0) concerns.push(`${highVeryHigh.length} active high/very high contextual safeguarding risk${highVeryHigh.length > 1 ? "s" : ""} — requires urgent multi-agency response.`);
  if (overdueReviews > 0) concerns.push(`${overdueReviews} contextual risk review${overdueReviews > 1 ? "s" : ""} overdue — active risks must be reviewed on schedule.`);
  if (childrenNotScreened.length > 0) concerns.push(`${childrenNotScreened.length} child${childrenNotScreened.length > 1 ? "ren" : ""} not screened for exploitation — all children must be assessed.`);
  if (safetyPlanRate < 100 && highRiskScreenings.length > 0) concerns.push(`${highRiskScreenings.length - withSafetyPlan} high-risk child${(highRiskScreenings.length - withSafetyPlan) > 1 ? "ren" : ""} without a safety plan — immediate action required.`);
  if (unresolvedHC > 0) concerns.push(`${unresolvedHC} high/critical online safety incident${unresolvedHC > 1 ? "s" : ""} unresolved — these require urgent follow-up.`);
  if (discussionRate < 60 && online90d.length > 0) concerns.push(`Child discussions only conducted after ${discussionRate}% of online incidents — children need support to understand digital risks.`);
  if (multiAgencyRate < 60 && contextual_risks.length > 0) concerns.push(`Multi-agency engagement on only ${multiAgencyRate}% of contextual risks — safeguarding is a shared responsibility.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: SafeguardingRecommendation[] = [];
  let rank = 1;

  if (safetyPlanRate < 100 && highRiskScreenings.length > 0) {
    recs.push({ rank: rank++, recommendation: `Create safety plans for all high-risk children — ${highRiskScreenings.length - withSafetyPlan} currently without.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (highVeryHigh.length > 2) {
    recs.push({ rank: rank++, recommendation: "Escalate contextual safeguarding concerns to the local authority — multiple high/very high risks require multi-agency strategy.", urgency: "immediate", regulatory_ref: "Reg 34" });
  }
  if (overdueReviews > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueReviews} overdue contextual risk review${overdueReviews > 1 ? "s" : ""}.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (childrenNotScreened.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete exploitation screening for ${childrenNotScreened.length} unscreened child${childrenNotScreened.length > 1 ? "ren" : ""}.`, urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (unresolvedHC > 0) {
    recs.push({ rank: rank++, recommendation: `Resolve ${unresolvedHC} outstanding high/critical online safety incident${unresolvedHC > 1 ? "s" : ""}.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: SafeguardingInsight[] = [];

  if (highVeryHigh.length > 0) {
    insights.push({ text: `${highVeryHigh.length} active high/very high contextual risk${highVeryHigh.length > 1 ? "s" : ""}. Ofsted will examine whether the home is working effectively with partners to manage environmental threats.`, severity: "critical" });
  }
  if (safetyPlanRate < 100 && highRiskScreenings.length > 0) {
    insights.push({ text: `Not all high-risk children have safety plans. Ofsted expects every child at risk of exploitation to have a clear, multi-agency safety plan.`, severity: "critical" });
  }
  if (overdueReviews > 0) {
    insights.push({ text: `${overdueReviews} overdue contextual risk review${overdueReviews > 1 ? "s" : ""}. Ofsted expects active risks to be reviewed regularly with clear management oversight.`, severity: "critical" });
  }
  if (childrenNotScreened.length > 0) {
    insights.push({ text: `${childrenNotScreened.length} child${childrenNotScreened.length > 1 ? "ren" : ""} not screened for exploitation. Ofsted expects all looked-after children to be regularly screened for exploitation risk.`, severity: "warning" });
  }
  if (screenCoverage >= 80 && (highRiskScreenings.length === 0 || safetyPlanRate === 100) && latestScreenings.length > 0) {
    insights.push({ text: `${screenCoverage}% exploitation screening coverage with complete safety planning. This demonstrates proactive safeguarding — Ofsted's key expectation under 'Safe.'`, severity: "positive" });
  }
  if (multiAgencyRate >= 80 && contextual_risks.length > 0) {
    insights.push({ text: `Multi-agency engagement on ${multiAgencyRate}% of contextual risks evidences effective partnership working — a hallmark of outstanding safeguarding.`, severity: "positive" });
  }
  if (unresolvedHC === 0 && online90d.length > 0) {
    insights.push({ text: "All high/critical online safety incidents resolved promptly. This demonstrates effective digital safeguarding and responsive risk management.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding safeguarding practice — ${screenCoverage}% exploitation screening coverage with proactive contextual risk management.`;
  } else if (rating === "good") {
    headline = `Good safeguarding practice — effective risk identification with ${screenCoverage}% screening coverage.`;
  } else if (rating === "adequate") {
    headline = "Adequate safeguarding — gaps in screening coverage, risk management, or multi-agency working need addressing.";
  } else {
    headline = "Safeguarding practice is inadequate — significant gaps in exploitation screening, risk management, or follow-up.";
  }

  return {
    safeguarding_rating: rating,
    safeguarding_score: score,
    headline,
    contextual_risk_profile: ctxProfile,
    exploitation_profile: expProfile,
    online_safety_profile: onlineProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ─────────────────────────────────────────────────────────

function emptyCtxProfile(): ContextualRiskProfile {
  return {
    total_risks: 0, active_count: 0, escalated_count: 0,
    high_very_high_count: 0, overdue_reviews: 0,
    multi_agency_rate: 0, protective_action_rate: 0,
  };
}

function emptyExpProfile(childIds: string[]): ExploitationProfile {
  return {
    total_screenings: 0, children_screened: [],
    children_not_screened: [...childIds], screening_coverage: 0,
    high_risk_count: 0, safety_plan_rate: 0,
    social_worker_notification_rate: 0, nrm_referral_count: 0,
    avg_multi_agency: 0,
  };
}

function emptyOnlineProfile(): OnlineSafetyProfile {
  return {
    total_incidents_90d: 0, high_critical_count: 0,
    unresolved_high_critical: 0, child_discussion_rate: 0,
    follow_up_rate: 0, parent_notification_rate: 0,
    children_affected: [],
  };
}
