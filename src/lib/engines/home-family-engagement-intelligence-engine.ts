// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FAMILY ENGAGEMENT INTELLIGENCE ENGINE
// Home-level: analyses family time sessions and family relationship records
// to assess contact quality, child voice capture, social worker notification,
// relationship trajectories, and placement stability through family links.
// CHR 2015 Reg 7, 8, 9. SCCIF: "Effective."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FamilyTimeInput {
  id: string;
  date: string;
  child_id: string;
  duration_minutes: number;
  supervision_level: string;                   // supervised | semi_supervised | unsupervised
  was_safe: boolean;
  has_concerns: boolean;
  has_positive_observations: boolean;
  has_child_voice: boolean;
  report_sent_to_sw: boolean;
  has_recommendations: boolean;
}

export interface FamilyRelationshipInput {
  id: string;
  assessment_date: string;
  child_id: string;
  relationship_type: string;                   // parent | sibling | grandparent | extended_family | other
  quality_1_to_10: number;
  trajectory: string;                          // improving | stable | declining | volatile
  has_child_wishes: boolean;
  has_interventions: boolean;
  has_risk_factors: boolean;
  has_protective_factors: boolean;
  next_review: string;
}

export interface HomeFamilyEngagementInput {
  today: string;
  total_children: number;
  child_ids: string[];
  family_time_sessions: FamilyTimeInput[];
  family_relationships: FamilyRelationshipInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FamilyEngagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ContactProfile {
  total_sessions_90d: number;
  children_with_contact: string[];
  children_without_contact: string[];
  contact_coverage: number;
  avg_duration_minutes: number;
  safety_rate: number;
  concern_count: number;
  positive_observation_rate: number;
}

export interface ChildVoiceProfile {
  voice_capture_rate: number;
  sw_notification_rate: number;
  recommendation_rate: number;
}

export interface RelationshipProfile {
  total_assessments: number;
  children_assessed: string[];
  children_not_assessed: string[];
  assessment_coverage: number;
  avg_quality_score: number;
  improving_count: number;
  declining_count: number;
  volatile_count: number;
  overdue_reviews: number;
  intervention_rate: number;
  child_wishes_rate: number;
}

export interface FamilyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FamilyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeFamilyEngagementResult {
  family_engagement_rating: FamilyEngagementRating;
  family_engagement_score: number;
  headline: string;
  contact_profile: ContactProfile;
  child_voice_profile: ChildVoiceProfile;
  relationship_profile: RelationshipProfile;
  strengths: string[];
  concerns: string[];
  recommendations: FamilyRecommendation[];
  insights: FamilyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FamilyEngagementRating {
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

export function computeHomeFamilyEngagement(
  input: HomeFamilyEngagementInput,
): HomeFamilyEngagementResult {
  const { today, total_children, child_ids, family_time_sessions, family_relationships } = input;

  // 90-day window for sessions
  const sessions90d = family_time_sessions.filter(s => daysBetween(s.date, today) <= 90);

  // Latest relationship assessment per child+family_member
  const latestRelByKey = new Map<string, FamilyRelationshipInput>();
  for (const r of family_relationships) {
    const key = `${r.child_id}::${r.relationship_type}`;
    const existing = latestRelByKey.get(key);
    if (!existing || r.assessment_date > existing.assessment_date) {
      latestRelByKey.set(key, r);
    }
  }
  const latestRelationships = [...latestRelByKey.values()];

  // Insufficient data
  if (sessions90d.length === 0 && latestRelationships.length === 0) {
    return {
      family_engagement_rating: "insufficient_data",
      family_engagement_score: 0,
      headline: "No family engagement data available.",
      contact_profile: emptyContactProfile(),
      child_voice_profile: emptyVoiceProfile(),
      relationship_profile: emptyRelProfile(child_ids),
      strengths: [],
      concerns: ["No family time sessions or relationship assessments found."],
      recommendations: [{ rank: 1, recommendation: "Complete family relationship assessments for all children and ensure family time sessions are recorded.", urgency: "immediate", regulatory_ref: "Reg 7" }],
      insights: [{ text: "No family engagement data exists. Ofsted expects children's homes to actively support and facilitate family relationships where safe to do so.", severity: "critical" }],
    };
  }

  // ── Contact Profile ─────────────────────────────────────────────────
  const childrenWithContact = [...new Set(sessions90d.map(s => s.child_id))];
  const childrenWithoutContact = child_ids.filter(id => !childrenWithContact.includes(id));
  const contactCoverage = total_children > 0 ? pct(childrenWithContact.length, total_children) : 0;

  const avgDuration = sessions90d.length > 0
    ? Math.round(sessions90d.reduce((a, s) => a + s.duration_minutes, 0) / sessions90d.length)
    : 0;

  const safeSessions = sessions90d.filter(s => s.was_safe).length;
  const safetyRate = pct(safeSessions, sessions90d.length);

  const concernCount = sessions90d.filter(s => s.has_concerns).length;

  const withPositive = sessions90d.filter(s => s.has_positive_observations).length;
  const positiveRate = pct(withPositive, sessions90d.length);

  const contactProfile: ContactProfile = {
    total_sessions_90d: sessions90d.length,
    children_with_contact: childrenWithContact,
    children_without_contact: childrenWithoutContact,
    contact_coverage: contactCoverage,
    avg_duration_minutes: avgDuration,
    safety_rate: safetyRate,
    concern_count: concernCount,
    positive_observation_rate: positiveRate,
  };

  // ── Child Voice Profile ─────────────────────────────────────────────
  const withVoice = sessions90d.filter(s => s.has_child_voice).length;
  const voiceRate = pct(withVoice, sessions90d.length);

  const swNotified = sessions90d.filter(s => s.report_sent_to_sw).length;
  const swRate = pct(swNotified, sessions90d.length);

  const withRecs = sessions90d.filter(s => s.has_recommendations).length;
  const recRate = pct(withRecs, sessions90d.length);

  const voiceProfile: ChildVoiceProfile = {
    voice_capture_rate: voiceRate,
    sw_notification_rate: swRate,
    recommendation_rate: recRate,
  };

  // ── Relationship Profile ────────────────────────────────────────────
  const childrenAssessed = [...new Set(latestRelationships.map(r => r.child_id))];
  const childrenNotAssessed = child_ids.filter(id => !childrenAssessed.includes(id));
  const assessmentCoverage = total_children > 0 ? pct(childrenAssessed.length, total_children) : 0;

  const qualityScores = latestRelationships.map(r => r.quality_1_to_10).filter(q => q > 0);
  const avgQuality = qualityScores.length > 0
    ? Math.round((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 10) / 10
    : 0;

  const improvingCount = latestRelationships.filter(r => r.trajectory === "improving").length;
  const decliningCount = latestRelationships.filter(r => r.trajectory === "declining").length;
  const volatileCount = latestRelationships.filter(r => r.trajectory === "volatile").length;

  const overdueReviews = latestRelationships.filter(r => r.next_review && r.next_review < today).length;

  const withInterventions = latestRelationships.filter(r => r.has_interventions).length;
  const interventionRate = pct(withInterventions, latestRelationships.length);

  const withWishes = latestRelationships.filter(r => r.has_child_wishes).length;
  const wishesRate = pct(withWishes, latestRelationships.length);

  const relProfile: RelationshipProfile = {
    total_assessments: latestRelationships.length,
    children_assessed: childrenAssessed,
    children_not_assessed: childrenNotAssessed,
    assessment_coverage: assessmentCoverage,
    avg_quality_score: avgQuality,
    improving_count: improvingCount,
    declining_count: decliningCount,
    volatile_count: volatileCount,
    overdue_reviews: overdueReviews,
    intervention_rate: interventionRate,
    child_wishes_rate: wishesRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // 1. Contact coverage (±5)
  if (sessions90d.length > 0) {
    if (contactCoverage >= 80) score += 5;
    else if (contactCoverage >= 60) score += 2;
    else score -= 3;
  }

  // 2. Safety (±3)
  if (sessions90d.length > 0) {
    if (safetyRate === 100) score += 3;
    else score -= 3;
  }

  // 3. Child voice capture (±4)
  if (sessions90d.length > 0) {
    if (voiceRate >= 80) score += 4;
    else if (voiceRate >= 60) score += 2;
    else score -= 3;
  }

  // 4. SW notification (±3)
  if (sessions90d.length > 0) {
    if (swRate >= 80) score += 3;
    else if (swRate >= 60) score += 1;
    else score -= 2;
  }

  // 5. Assessment coverage (±5)
  if (latestRelationships.length > 0) {
    if (assessmentCoverage >= 80) score += 5;
    else if (assessmentCoverage >= 60) score += 2;
    else score -= 3;
  }

  // 6. Relationship quality (±3)
  if (qualityScores.length > 0) {
    if (avgQuality >= 7) score += 3;
    else if (avgQuality >= 5) score += 1;
    else score -= 2;
  }

  // 7. Trajectory (±3)
  if (latestRelationships.length > 0) {
    if (decliningCount === 0 && volatileCount === 0) score += 3;
    else if (decliningCount <= 1) score += 1;
    else score -= 3;
  }

  // 8. Overdue reviews (±3)
  if (latestRelationships.length > 0) {
    if (overdueReviews === 0) score += 3;
    else score -= 3;
  }

  // 9. Child wishes in relationships (±2)
  if (latestRelationships.length > 0) {
    if (wishesRate >= 80) score += 2;
    else score -= 1;
  }

  // 10. Positive observations (±2)
  if (sessions90d.length > 0) {
    if (positiveRate >= 80) score += 2;
    else if (positiveRate >= 50) score += 1;
    else score -= 1;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (contactCoverage >= 80 && sessions90d.length > 0) strengths.push(`${contactCoverage}% of children have had family contact in the last 90 days — strong family engagement.`);
  if (safetyRate === 100 && sessions90d.length > 0) strengths.push("All family time sessions assessed as safe — safeguarding within family contact is effective.");
  if (voiceRate >= 80 && sessions90d.length > 0) strengths.push(`Child voice captured after ${voiceRate}% of family time sessions — children's feelings about contact are actively sought.`);
  if (swRate >= 80 && sessions90d.length > 0) strengths.push(`Social worker notified after ${swRate}% of sessions — communication with placing authorities is consistent.`);
  if (assessmentCoverage >= 80 && latestRelationships.length > 0) strengths.push(`${assessmentCoverage}% of children have family relationship assessments — proactive understanding of family dynamics.`);
  if (avgQuality >= 7 && qualityScores.length > 0) strengths.push(`Average relationship quality score ${avgQuality}/10 — family relationships are generally positive.`);
  if (improvingCount > 0 && decliningCount === 0) strengths.push(`${improvingCount} family relationship${improvingCount > 1 ? "s" : ""} on an improving trajectory — the home is positively influencing family connections.`);
  if (overdueReviews === 0 && latestRelationships.length > 0) strengths.push("All family relationship reviews are current — management oversight of family links is timely.");
  if (positiveRate >= 80 && sessions90d.length > 0) strengths.push(`Positive observations recorded in ${positiveRate}% of sessions — quality of contact recording is thorough.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutContact.length > 0 && sessions90d.length > 0) concerns.push(`${childrenWithoutContact.length} child${childrenWithoutContact.length > 1 ? "ren" : ""} without family contact in the last 90 days — all children should have facilitated contact where safe.`);
  if (safetyRate < 100 && sessions90d.length > 0) concerns.push(`${sessions90d.length - safeSessions} family time session${(sessions90d.length - safeSessions) > 1 ? "s" : ""} flagged as unsafe — immediate review of contact arrangements required.`);
  if (voiceRate < 60 && sessions90d.length > 0) concerns.push(`Child voice only captured after ${voiceRate}% of sessions — children must be asked about their feelings after contact.`);
  if (swRate < 60 && sessions90d.length > 0) concerns.push(`Social worker notified after only ${swRate}% of sessions — placing authorities must be kept informed.`);
  if (childrenNotAssessed.length > 0 && latestRelationships.length > 0) concerns.push(`${childrenNotAssessed.length} child${childrenNotAssessed.length > 1 ? "ren" : ""} without family relationship assessments.`);
  if (decliningCount > 0) concerns.push(`${decliningCount} family relationship${decliningCount > 1 ? "s" : ""} declining — targeted intervention needed.`);
  if (overdueReviews > 0) concerns.push(`${overdueReviews} family relationship review${overdueReviews > 1 ? "s" : ""} overdue — reviews must be completed on schedule.`);
  if (concernCount > 2) concerns.push(`${concernCount} sessions raised concerns in 90 days — patterns of concern in family contact need analysis.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: FamilyRecommendation[] = [];
  let rank = 1;

  if (safetyRate < 100 && sessions90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Review unsafe family time sessions and update risk assessments and contact plans.", urgency: "immediate", regulatory_ref: "Reg 7" });
  }
  if (childrenWithoutContact.length > 0 && sessions90d.length > 0) {
    recs.push({ rank: rank++, recommendation: `Facilitate family contact for ${childrenWithoutContact.length} child${childrenWithoutContact.length > 1 ? "ren" : ""} without recent sessions, or document reasons contact is not in the child's interests.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (voiceRate < 60 && sessions90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure child voice is captured after every family time session — record feelings, wishes, and any worries.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (childrenNotAssessed.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete family relationship assessments for ${childrenNotAssessed.length} unassessed child${childrenNotAssessed.length > 1 ? "ren" : ""}.`, urgency: "soon", regulatory_ref: "Reg 8" });
  }
  if (overdueReviews > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueReviews} overdue family relationship review${overdueReviews > 1 ? "s" : ""}.`, urgency: "soon", regulatory_ref: "Reg 9" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: FamilyInsight[] = [];

  if (safetyRate < 100 && sessions90d.length > 0) {
    insights.push({ text: `${sessions90d.length - safeSessions} family time session${(sessions90d.length - safeSessions) > 1 ? "s" : ""} flagged as unsafe. Ofsted expects robust risk assessment of all family contact — unsafe sessions require immediate review of contact arrangements.`, severity: "critical" });
  }
  if (decliningCount >= 2) {
    insights.push({ text: `${decliningCount} family relationships declining. Ofsted will examine whether the home is actively supporting and strengthening family bonds where safe.`, severity: "warning" });
  }
  if (childrenWithoutContact.length > 0 && sessions90d.length > 0) {
    insights.push({ text: `${childrenWithoutContact.length} child${childrenWithoutContact.length > 1 ? "ren" : ""} without family contact in 90 days. Ofsted expects homes to proactively facilitate family relationships unless there are documented safeguarding reasons not to.`, severity: "warning" });
  }
  if (contactCoverage >= 80 && voiceRate >= 80 && sessions90d.length > 0) {
    insights.push({ text: `${contactCoverage}% contact coverage with ${voiceRate}% child voice capture. This demonstrates child-centred family engagement — Ofsted's key expectation for outstanding homes.`, severity: "positive" });
  }
  if (swRate >= 80 && sessions90d.length > 0) {
    insights.push({ text: `Social worker notification rate ${swRate}% shows strong communication with placing authorities about family dynamics — a hallmark of effective partnership working.`, severity: "positive" });
  }
  if (assessmentCoverage >= 80 && wishesRate >= 80 && latestRelationships.length > 0) {
    insights.push({ text: `${assessmentCoverage}% relationship assessment coverage with ${wishesRate}% child wishes documented. The home demonstrates a comprehensive, child-centred understanding of family dynamics.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding family engagement — ${contactCoverage}% contact coverage with ${voiceRate}% child voice capture across ${sessions90d.length} sessions.`;
  } else if (rating === "good") {
    headline = `Good family engagement — consistent contact facilitation with ${contactCoverage}% coverage.`;
  } else if (rating === "adequate") {
    headline = "Adequate family engagement — gaps in contact coverage, child voice, or relationship assessment need addressing.";
  } else {
    headline = "Family engagement is inadequate — significant gaps in contact facilitation, child voice, or family relationship monitoring.";
  }

  return {
    family_engagement_rating: rating,
    family_engagement_score: score,
    headline,
    contact_profile: contactProfile,
    child_voice_profile: voiceProfile,
    relationship_profile: relProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyContactProfile(): ContactProfile {
  return {
    total_sessions_90d: 0, children_with_contact: [], children_without_contact: [],
    contact_coverage: 0, avg_duration_minutes: 0, safety_rate: 0,
    concern_count: 0, positive_observation_rate: 0,
  };
}

function emptyVoiceProfile(): ChildVoiceProfile {
  return { voice_capture_rate: 0, sw_notification_rate: 0, recommendation_rate: 0 };
}

function emptyRelProfile(childIds: string[]): RelationshipProfile {
  return {
    total_assessments: 0, children_assessed: [], children_not_assessed: childIds,
    assessment_coverage: 0, avg_quality_score: 0, improving_count: 0,
    declining_count: 0, volatile_count: 0, overdue_reviews: 0,
    intervention_rate: 0, child_wishes_rate: 0,
  };
}
