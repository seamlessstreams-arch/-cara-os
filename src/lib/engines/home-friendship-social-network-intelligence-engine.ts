// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FRIENDSHIP & SOCIAL NETWORK INTELLIGENCE ENGINE
// Monitors friendship mapping coverage, social network breadth, peer support
// quality, social isolation prevention, and child satisfaction with friendships.
// Evaluates how well the home supports children to develop and maintain
// meaningful friendships and social connections, identifies at-risk children,
// and ensures proactive intervention to prevent social isolation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider community), Reg 11 (Positive
// relationships). SCCIF: "Children develop positive relationships and
// experiences and progress."
// Store keys: friendshipMappingRecords, socialNetworkRecords,
//             peerSupportRecords, isolationPreventionRecords,
//             childSatisfactionRecords
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FriendshipMappingInput {
  id: string;
  child_id: string;
  mapping_date: string;
  mapper_role: "keyworker" | "social_worker" | "therapist" | "child_self" | "staff";
  total_friends_identified: number;
  friends_in_home: number;
  friends_outside_home: number;
  friends_from_school: number;
  friends_from_community: number;
  online_friends_identified: number;
  friendship_quality_rating: number; // 1-5
  child_involved_in_mapping: boolean;
  support_plan_in_place: boolean;
  review_date: string | null;
  review_overdue: boolean;
  concerns_identified: boolean;
  concerns_description: string;
  created_at: string;
}

export interface SocialNetworkInput {
  id: string;
  child_id: string;
  assessment_date: string;
  network_type: "family" | "peer" | "community" | "professional" | "online" | "school";
  contacts_count: number;
  positive_contacts: number;
  negative_contacts: number;
  neutral_contacts: number;
  network_stability: "stable" | "growing" | "declining" | "volatile" | "new";
  child_satisfaction_with_network: number; // 1-5
  barriers_identified: boolean;
  barriers_description: string;
  support_provided: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface PeerSupportInput {
  id: string;
  child_id: string;
  activity_date: string;
  activity_type: "group_activity" | "social_skills_session" | "mentoring" | "buddy_scheme" | "peer_mediation" | "shared_interest_group" | "structured_play";
  participants_count: number;
  child_engagement_rating: number; // 1-5
  peer_interaction_quality: number; // 1-5
  staff_facilitated: boolean;
  child_reported_enjoyment: boolean;
  skills_developed: string[];
  outcome_positive: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface IsolationPreventionInput {
  id: string;
  child_id: string;
  identified_date: string;
  risk_level: "high" | "medium" | "low";
  isolation_indicators: string[];
  intervention_type: "social_skills_programme" | "friendship_facilitation" | "community_group" | "therapeutic_support" | "family_reconnection" | "online_safety_support" | "peer_mentoring" | "activity_inclusion";
  intervention_start_date: string;
  intervention_active: boolean;
  progress_rating: number; // 1-5
  child_engagement: number; // 1-5
  outcome_improved: boolean;
  review_date: string | null;
  review_overdue: boolean;
  escalated_to_professional: boolean;
  created_at: string;
}

export interface ChildSatisfactionInput {
  id: string;
  child_id: string;
  survey_date: string;
  satisfaction_with_friendships: number; // 1-5
  feels_supported_by_staff: boolean;
  feels_included: boolean;
  has_best_friend: boolean;
  feels_lonely: boolean;
  wants_more_social_opportunities: boolean;
  confidence_in_social_situations: number; // 1-5
  satisfaction_with_contact_arrangements: number; // 1-5
  free_text_feedback: string;
  created_at: string;
}

export interface FriendshipSocialInput {
  today: string;
  total_children: number;
  friendship_mapping_records: FriendshipMappingInput[];
  social_network_records: SocialNetworkInput[];
  peer_support_records: PeerSupportInput[];
  isolation_prevention_records: IsolationPreventionInput[];
  child_satisfaction_records: ChildSatisfactionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FriendshipSocialRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FriendshipSocialInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FriendshipSocialRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface FriendshipSocialResult {
  friendship_rating: FriendshipSocialRating;
  friendship_score: number;
  headline: string;
  total_mappings: number;
  friendship_mapping_rate: number;
  social_network_rate: number;
  peer_support_rate: number;
  isolation_prevention_rate: number;
  child_satisfaction_rate: number;
  child_confidence_rate: number;
  // Null on empty — no mappings ⇒ no friends count / quality to average.
  // "0 friends / 0/5 quality" would read as "children are isolated and
  // dislike everyone", not "unmeasured".
  avg_friends_per_child: number | null;
  avg_friendship_quality: number | null;
  network_positivity_rate: number;
  // Null on empty — no peer activities ⇒ no engagement signal.
  peer_engagement_avg: number | null;
  isolation_high_risk_count: number;
  loneliness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: FriendshipSocialRecommendation[];
  insights: FriendshipSocialInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FriendshipSocialRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FriendshipSocialRating,
  score: number,
  headline: string,
): FriendshipSocialResult {
  return {
    friendship_rating: rating,
    friendship_score: score,
    headline,
    total_mappings: 0,
    friendship_mapping_rate: 0,
    social_network_rate: 0,
    peer_support_rate: 0,
    isolation_prevention_rate: 0,
    child_satisfaction_rate: 0,
    child_confidence_rate: 0,
    avg_friends_per_child: null,
    avg_friendship_quality: null,
    network_positivity_rate: 0,
    peer_engagement_avg: null,
    isolation_high_risk_count: 0,
    loneliness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFriendshipSocialNetwork(
  input: FriendshipSocialInput,
): FriendshipSocialResult {
  const {
    total_children,
    friendship_mapping_records,
    social_network_records,
    peer_support_records,
    isolation_prevention_records,
    child_satisfaction_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    friendship_mapping_records.length === 0 &&
    social_network_records.length === 0 &&
    peer_support_records.length === 0 &&
    isolation_prevention_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess friendship and social network quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No friendship or social network data recorded despite children on placement — friendship mapping, social support, and isolation prevention require urgent attention.",
      ),
      concerns: [
        "No friendship mapping records, social network assessments, peer support activities, isolation prevention records, or child satisfaction surveys exist despite children being on placement — the home cannot evidence that it supports children's friendships and social development.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured friendship mapping for all children to identify the breadth and quality of each child's friendships and social connections, enabling targeted support where needed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Establish social network assessments and peer support activities to ensure children are supported in developing and maintaining meaningful friendships both within and outside the home.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
        },
      ],
      insights: [
        {
          text: "The complete absence of friendship and social network records means the home cannot demonstrate that children are supported in forming positive relationships. Ofsted expects evidence that children develop meaningful friendships and are helped to maintain social connections. Without any friendship mapping or social support records, the home cannot evidence compliance with Reg 11 or demonstrate that children's social and emotional development is actively nurtured.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Friendship mapping coverage ---
  const totalMappings = friendship_mapping_records.length;
  const uniqueChildrenMapped = new Set(
    friendship_mapping_records.map((m) => m.child_id),
  ).size;
  const friendshipMappingRate =
    total_children > 0 ? pct(uniqueChildrenMapped, total_children) : 0;

  // --- Friendship quality metrics ---
  const childInvolvedInMapping = friendship_mapping_records.filter(
    (m) => m.child_involved_in_mapping,
  ).length;
  const childInvolvementRate = pct(childInvolvedInMapping, totalMappings);

  const mappingsWithSupportPlans = friendship_mapping_records.filter(
    (m) => m.support_plan_in_place,
  ).length;
  const supportPlanRate = pct(mappingsWithSupportPlans, totalMappings);

  const mappingsWithConcerns = friendship_mapping_records.filter(
    (m) => m.concerns_identified,
  ).length;
  const concernsRate = pct(mappingsWithConcerns, totalMappings);

  const overdueMappingReviews = friendship_mapping_records.filter(
    (m) => m.review_overdue,
  ).length;
  const mappingReviewComplianceRate: number | null = totalMappings > 0
    ? pct(totalMappings - overdueMappingReviews, totalMappings)
    : null;

  // --- Average friends per child ---
  const totalFriendsSum = friendship_mapping_records.reduce(
    (sum, m) => sum + m.total_friends_identified,
    0,
  );
  const avgFriendsPerChild: number | null =
    totalMappings > 0
      ? Math.round((totalFriendsSum / totalMappings) * 100) / 100
      : null;

  // --- Friendship quality average (1-5) ---
  const friendshipQualitySum = friendship_mapping_records.reduce(
    (sum, m) => sum + m.friendship_quality_rating,
    0,
  );
  const avgFriendshipQuality: number | null =
    totalMappings > 0
      ? Math.round((friendshipQualitySum / totalMappings) * 100) / 100
      : null;

  // --- Friends outside home ---
  const childrenWithOutsideFriends = friendship_mapping_records.filter(
    (m) => m.friends_outside_home > 0 || m.friends_from_school > 0 || m.friends_from_community > 0,
  ).length;
  const outsideFriendshipRate = pct(childrenWithOutsideFriends, totalMappings);

  // --- Children with zero friends ---
  const childrenWithNoFriends = friendship_mapping_records.filter(
    (m) => m.total_friends_identified === 0,
  ).length;
  const noFriendsRate = pct(childrenWithNoFriends, totalMappings);

  // --- Social network breadth ---
  const totalNetworks = social_network_records.length;
  const uniqueChildrenWithNetworks = new Set(
    social_network_records.map((n) => n.child_id),
  ).size;
  const socialNetworkRate =
    total_children > 0 ? pct(uniqueChildrenWithNetworks, total_children) : 0;

  // --- Network positivity ---
  const totalPositiveContacts = social_network_records.reduce(
    (sum, n) => sum + n.positive_contacts,
    0,
  );
  const totalAllContacts = social_network_records.reduce(
    (sum, n) => sum + n.contacts_count,
    0,
  );
  const networkPositivityRate = pct(totalPositiveContacts, totalAllContacts);

  // --- Network stability ---
  const stableOrGrowingNetworks = social_network_records.filter(
    (n) => n.network_stability === "stable" || n.network_stability === "growing",
  ).length;
  const networkStabilityRate = pct(stableOrGrowingNetworks, totalNetworks);

  const decliningNetworks = social_network_records.filter(
    (n) => n.network_stability === "declining" || n.network_stability === "volatile",
  ).length;
  const decliningNetworkRate = pct(decliningNetworks, totalNetworks);

  // --- Network barriers ---
  const networksWithBarriers = social_network_records.filter(
    (n) => n.barriers_identified,
  ).length;
  const barrierRate = pct(networksWithBarriers, totalNetworks);

  const networksWithSupport = social_network_records.filter(
    (n) => n.barriers_identified && n.support_provided,
  ).length;
  const barrierSupportRate: number | null = networksWithBarriers > 0
    ? pct(networksWithSupport, networksWithBarriers)
    : null;

  const overdueNetworkReviews = social_network_records.filter(
    (n) => n.review_overdue,
  ).length;

  // --- Network satisfaction average ---
  const networkSatisfactionSum = social_network_records.reduce(
    (sum, n) => sum + n.child_satisfaction_with_network,
    0,
  );
  const networkSatisfactionAvg: number | null =
    totalNetworks > 0
      ? Math.round((networkSatisfactionSum / totalNetworks) * 100) / 100
      : null;

  // --- Peer support quality ---
  const totalPeerActivities = peer_support_records.length;
  const uniqueChildrenInPeerSupport = new Set(
    peer_support_records.map((p) => p.child_id),
  ).size;
  const peerSupportRate =
    total_children > 0 ? pct(uniqueChildrenInPeerSupport, total_children) : 0;

  const peerEngagementSum = peer_support_records.reduce(
    (sum, p) => sum + p.child_engagement_rating,
    0,
  );
  const peerEngagementAvg: number | null =
    totalPeerActivities > 0
      ? Math.round((peerEngagementSum / totalPeerActivities) * 100) / 100
      : null;

  const peerInteractionQualitySum = peer_support_records.reduce(
    (sum, p) => sum + p.peer_interaction_quality,
    0,
  );
  const peerInteractionQualityAvg: number | null =
    totalPeerActivities > 0
      ? Math.round((peerInteractionQualitySum / totalPeerActivities) * 100) / 100
      : null;

  const positiveOutcomeActivities = peer_support_records.filter(
    (p) => p.outcome_positive,
  ).length;
  const peerOutcomeRate = pct(positiveOutcomeActivities, totalPeerActivities);

  const childEnjoyedActivities = peer_support_records.filter(
    (p) => p.child_reported_enjoyment,
  ).length;
  const peerEnjoymentRate = pct(childEnjoyedActivities, totalPeerActivities);

  const staffFacilitatedActivities = peer_support_records.filter(
    (p) => p.staff_facilitated,
  ).length;
  const staffFacilitationRate = pct(staffFacilitatedActivities, totalPeerActivities);

  const peerActivitiesWithNotes = peer_support_records.filter(
    (p) => p.notes_recorded,
  ).length;
  const peerDocumentationRate = pct(peerActivitiesWithNotes, totalPeerActivities);

  // --- Isolation prevention ---
  const totalIsolationRecords = isolation_prevention_records.length;
  const activeIsolationInterventions = isolation_prevention_records.filter(
    (i) => i.intervention_active,
  ).length;

  const highRiskIsolation = isolation_prevention_records.filter(
    (i) => i.risk_level === "high" && i.intervention_active,
  ).length;

  const isolationImproved = isolation_prevention_records.filter(
    (i) => i.outcome_improved,
  ).length;
  const isolationPreventionRate = pct(isolationImproved, totalIsolationRecords);

  const isolationEngagementSum = isolation_prevention_records.reduce(
    (sum, i) => sum + i.child_engagement,
    0,
  );
  const isolationEngagementAvg: number | null =
    totalIsolationRecords > 0
      ? Math.round((isolationEngagementSum / totalIsolationRecords) * 100) / 100
      : null;

  const isolationProgressSum = isolation_prevention_records.reduce(
    (sum, i) => sum + i.progress_rating,
    0,
  );
  const isolationProgressAvg: number | null =
    totalIsolationRecords > 0
      ? Math.round((isolationProgressSum / totalIsolationRecords) * 100) / 100
      : null;

  const overdueIsolationReviews = isolation_prevention_records.filter(
    (i) => i.review_overdue && i.intervention_active,
  ).length;

  const escalatedToProf = isolation_prevention_records.filter(
    (i) => i.escalated_to_professional,
  ).length;
  const escalationRate = pct(escalatedToProf, totalIsolationRecords);

  const highRiskWithEscalation = isolation_prevention_records.filter(
    (i) => i.risk_level === "high" && i.escalated_to_professional,
  ).length;
  const highRiskTotal = isolation_prevention_records.filter(
    (i) => i.risk_level === "high",
  ).length;
  const highRiskEscalationRate = pct(highRiskWithEscalation, highRiskTotal);

  // --- Child satisfaction ---
  const totalSurveys = child_satisfaction_records.length;
  const uniqueChildrenSurveyed = new Set(
    child_satisfaction_records.map((s) => s.child_id),
  ).size;

  const satisfactionSum = child_satisfaction_records.reduce(
    (sum, s) => sum + s.satisfaction_with_friendships,
    0,
  );
  const satisfactionAvg: number | null =
    totalSurveys > 0
      ? Math.round((satisfactionSum / totalSurveys) * 100) / 100
      : null;

  const satisfiedChildren = child_satisfaction_records.filter(
    (s) => s.satisfaction_with_friendships >= 4,
  ).length;
  const childSatisfactionRate = pct(satisfiedChildren, totalSurveys);

  const confidentChildren = child_satisfaction_records.filter(
    (s) => s.confidence_in_social_situations >= 4,
  ).length;
  const childConfidenceRate = pct(confidentChildren, totalSurveys);

  const confidenceSum = child_satisfaction_records.reduce(
    (sum, s) => sum + s.confidence_in_social_situations,
    0,
  );
  const confidenceAvg: number | null =
    totalSurveys > 0
      ? Math.round((confidenceSum / totalSurveys) * 100) / 100
      : null;

  const childrenFeelIncluded = child_satisfaction_records.filter(
    (s) => s.feels_included,
  ).length;
  const inclusionRate = pct(childrenFeelIncluded, totalSurveys);

  const childrenFeelSupported = child_satisfaction_records.filter(
    (s) => s.feels_supported_by_staff,
  ).length;
  const staffSupportRate = pct(childrenFeelSupported, totalSurveys);

  const childrenWithBestFriend = child_satisfaction_records.filter(
    (s) => s.has_best_friend,
  ).length;
  const bestFriendRate = pct(childrenWithBestFriend, totalSurveys);

  const childrenFeelingLonely = child_satisfaction_records.filter(
    (s) => s.feels_lonely,
  ).length;
  const lonelinessRate = pct(childrenFeelingLonely, totalSurveys);

  const childrenWantingMoreSocial = child_satisfaction_records.filter(
    (s) => s.wants_more_social_opportunities,
  ).length;
  const wantMoreSocialRate = pct(childrenWantingMoreSocial, totalSurveys);

  const contactSatisfactionSum = child_satisfaction_records.reduce(
    (sum, s) => sum + s.satisfaction_with_contact_arrangements,
    0,
  );
  const contactSatisfactionAvg: number | null =
    totalSurveys > 0
      ? Math.round((contactSatisfactionSum / totalSurveys) * 100) / 100
      : null;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: friendshipMappingRate (>=100: +4, >=80: +2) ---
  if (friendshipMappingRate >= 100) score += 4;
  else if (friendshipMappingRate >= 80) score += 2;

  // --- Bonus 2: socialNetworkRate (>=100: +4, >=80: +2) ---
  if (socialNetworkRate >= 100) score += 4;
  else if (socialNetworkRate >= 80) score += 2;

  // --- Bonus 3: peerSupportRate (>=80: +3, >=60: +1) ---
  if (peerSupportRate >= 80) score += 3;
  else if (peerSupportRate >= 60) score += 1;

  // --- Bonus 4: isolationPreventionRate (>=90: +4, >=70: +2) ---
  if (isolationPreventionRate >= 90) score += 4;
  else if (isolationPreventionRate >= 70) score += 2;

  // --- Bonus 5: childSatisfactionRate (>=90: +4, >=70: +2) ---
  if (childSatisfactionRate >= 90) score += 4;
  else if (childSatisfactionRate >= 70) score += 2;

  // --- Bonus 6: childConfidenceRate (>=90: +3, >=70: +1) ---
  if (childConfidenceRate >= 90) score += 3;
  else if (childConfidenceRate >= 70) score += 1;

  // --- Bonus 7: avgFriendshipQuality (>=4.0: +3, >=3.0: +1) ---
  if (meets(avgFriendshipQuality, 4.0)) score += 3;
  else if (meets(avgFriendshipQuality, 3.0)) score += 1;

  // --- Bonus 8: mappingReviewComplianceRate (>=100: +2, >=80: +1) ---
  if (meets(mappingReviewComplianceRate, 100)) score += 2;
  else if (meets(mappingReviewComplianceRate, 80)) score += 1;

  // --- Bonus 9: networkPositivityRate (>=90: +1) ---
  if (networkPositivityRate >= 90) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // friendshipMappingRate < 50 → -5
  if (friendshipMappingRate < 50 && total_children > 0) score -= 5;

  // socialNetworkRate < 50 → -5
  if (socialNetworkRate < 50 && social_network_records.length > 0) score -= 5;

  // isolationPreventionRate < 40 → -4
  if (isolationPreventionRate < 40 && totalIsolationRecords > 0) score -= 4;

  // lonelinessRate > 50 → -4
  if (lonelinessRate > 50 && totalSurveys > 0) score -= 4;

  score = clamp(score, 0, 100);

  const friendship_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (friendshipMappingRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a friendship mapping assessment — the home demonstrates comprehensive identification of each child's social connections and friendship quality.",
    );
  } else if (friendshipMappingRate >= 80 && total_children > 0) {
    strengths.push(
      `${friendshipMappingRate}% of children have friendship mappings — strong coverage in understanding children's friendship networks and social connections.`,
    );
  }

  if (socialNetworkRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a social network assessment — the home maintains a thorough understanding of each child's broader social connections and support systems.",
    );
  } else if (socialNetworkRate >= 80 && total_children > 0) {
    strengths.push(
      `${socialNetworkRate}% of children have social network assessments — good coverage in mapping children's wider social connections.`,
    );
  }

  if (peerSupportRate >= 80 && total_children > 0) {
    strengths.push(
      `${peerSupportRate}% of children are participating in peer support activities — strong engagement in structured social opportunities.`,
    );
  } else if (peerSupportRate >= 60 && total_children > 0) {
    strengths.push(
      `${peerSupportRate}% of children engaged in peer support activities — the home provides reasonable social opportunities for most children.`,
    );
  }

  if (isolationPreventionRate >= 90 && totalIsolationRecords > 0) {
    strengths.push(
      `${isolationPreventionRate}% of isolation prevention interventions showing improvement — the home is highly effective at identifying and addressing social isolation risks.`,
    );
  } else if (isolationPreventionRate >= 70 && totalIsolationRecords > 0) {
    strengths.push(
      `${isolationPreventionRate}% of isolation prevention interventions showing improvement — the majority of at-risk children are benefiting from targeted support.`,
    );
  }

  if (childSatisfactionRate >= 90 && totalSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% of children report high satisfaction with their friendships — children overwhelmingly feel the home supports them in maintaining meaningful social connections.`,
    );
  } else if (childSatisfactionRate >= 70 && totalSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% of children are satisfied with their friendships — most children report positive experiences with social relationships.`,
    );
  }

  if (childConfidenceRate >= 90 && totalSurveys > 0) {
    strengths.push(
      `${childConfidenceRate}% of children report high confidence in social situations — children feel empowered and capable in their social interactions.`,
    );
  } else if (childConfidenceRate >= 70 && totalSurveys > 0) {
    strengths.push(
      `${childConfidenceRate}% of children report social confidence — most children feel comfortable in social situations.`,
    );
  }

  if (meets(avgFriendshipQuality, 4.0) && totalMappings > 0) {
    strengths.push(
      `Average friendship quality rating of ${avgFriendshipQuality}/5 — children's friendships are of a high quality, indicating meaningful and supportive relationships.`,
    );
  } else if (meets(avgFriendshipQuality, 3.0) && totalMappings > 0) {
    strengths.push(
      `Average friendship quality rating of ${avgFriendshipQuality}/5 — children generally have competent quality friendships.`,
    );
  }

  if (networkPositivityRate >= 90 && totalAllContacts > 0) {
    strengths.push(
      `${networkPositivityRate}% of social network contacts are positive — children are predominantly surrounded by supportive, constructive relationships.`,
    );
  } else if (networkPositivityRate >= 70 && totalAllContacts > 0) {
    strengths.push(
      `${networkPositivityRate}% positive social contacts — the majority of children's social networks are beneficial.`,
    );
  }

  if (outsideFriendshipRate >= 80 && totalMappings > 0) {
    strengths.push(
      `${outsideFriendshipRate}% of children have friendships outside the home — the home effectively supports children in maintaining connections with the wider community.`,
    );
  } else if (outsideFriendshipRate >= 60 && totalMappings > 0) {
    strengths.push(
      `${outsideFriendshipRate}% of children have friendships outside the home — most children have social connections beyond the care setting.`,
    );
  }

  if (inclusionRate >= 90 && totalSurveys > 0) {
    strengths.push(
      `${inclusionRate}% of children feel included — the home fosters a welcoming social environment where children feel they belong.`,
    );
  }

  if (staffSupportRate >= 90 && totalSurveys > 0) {
    strengths.push(
      `${staffSupportRate}% of children feel supported by staff in their friendships — staff play an active, valued role in facilitating children's social development.`,
    );
  }

  if (bestFriendRate >= 80 && totalSurveys > 0) {
    strengths.push(
      `${bestFriendRate}% of children report having a best friend — a strong indicator that children are forming deep, meaningful attachments.`,
    );
  }

  if (peerEnjoymentRate >= 90 && totalPeerActivities > 0) {
    strengths.push(
      `${peerEnjoymentRate}% of children report enjoying peer support activities — activities are well-matched to children's interests and social needs.`,
    );
  }

  if (peerOutcomeRate >= 90 && totalPeerActivities > 0) {
    strengths.push(
      `${peerOutcomeRate}% of peer support activities achieved positive outcomes — structured social activities are making a genuine difference to children's social skills and relationships.`,
    );
  }

  if (networkStabilityRate >= 80 && totalNetworks > 0) {
    strengths.push(
      `${networkStabilityRate}% of social networks are stable or growing — children's social connections are being maintained and developing positively over time.`,
    );
  }

  if (meets(barrierSupportRate, 90) && networksWithBarriers > 0) {
    strengths.push(
      `${barrierSupportRate}% of identified social barriers have support in place — the home responds proactively when children face obstacles to social connection.`,
    );
  }

  if (childInvolvementRate >= 90 && totalMappings > 0) {
    strengths.push(
      "Children are actively involved in the vast majority of friendship mapping assessments — assessments are genuinely child-centred and participatory.",
    );
  }

  if (meets(mappingReviewComplianceRate, 100) && totalMappings > 0) {
    strengths.push(
      "All friendship mapping reviews are up to date — the home ensures assessments remain current and reflect children's evolving social landscape.",
    );
  } else if (meets(mappingReviewComplianceRate, 80) && totalMappings > 0) {
    strengths.push(
      `${mappingReviewComplianceRate}% of friendship mapping reviews are on schedule — strong compliance with review timescales.`,
    );
  }

  if (peerDocumentationRate >= 90 && totalPeerActivities > 0) {
    strengths.push(
      `${peerDocumentationRate}% of peer support activities have documented notes — strong recording practice supporting evidence of social development work.`,
    );
  }

  if (lonelinessRate === 0 && totalSurveys > 0) {
    strengths.push(
      "No children report feeling lonely — the home has successfully created an inclusive social environment where every child feels connected.",
    );
  }

  if (highRiskEscalationRate >= 100 && highRiskTotal > 0) {
    strengths.push(
      "All high-risk isolation cases have been escalated to professionals — the home ensures the most vulnerable children receive specialist social support.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (friendshipMappingRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${friendshipMappingRate}% of children have friendship mappings — the majority of children's friendship networks have not been formally assessed, preventing the home from understanding or supporting their social connections.`,
    );
  } else if (friendshipMappingRate < 80 && friendshipMappingRate >= 50 && total_children > 0) {
    concerns.push(
      `Friendship mapping coverage at ${friendshipMappingRate}% — some children's friendship networks remain unassessed, which may result in unidentified social needs and missed opportunities for support.`,
    );
  }

  if (socialNetworkRate < 50 && social_network_records.length > 0) {
    concerns.push(
      `Only ${socialNetworkRate}% of children have social network assessments — the majority of children's broader social connections are not being formally evaluated.`,
    );
  } else if (socialNetworkRate < 80 && socialNetworkRate >= 50 && social_network_records.length > 0) {
    concerns.push(
      `Social network assessment coverage at ${socialNetworkRate}% — some children lack a formal assessment of their wider social connections and support systems.`,
    );
  }

  if (peerSupportRate < 40 && total_children > 0 && totalPeerActivities > 0) {
    concerns.push(
      `Only ${peerSupportRate}% of children are engaging in peer support activities — most children are not accessing structured social development opportunities.`,
    );
  } else if (peerSupportRate < 60 && peerSupportRate >= 40 && total_children > 0 && totalPeerActivities > 0) {
    concerns.push(
      `Peer support participation at ${peerSupportRate}% — not all children are engaging in structured social activities, which may leave some without adequate social skill development support.`,
    );
  }

  if (isolationPreventionRate < 40 && totalIsolationRecords > 0) {
    concerns.push(
      `Only ${isolationPreventionRate}% of isolation prevention interventions showing improvement — the majority of at-risk children are not benefiting from the support provided, suggesting interventions need fundamental review.`,
    );
  } else if (isolationPreventionRate < 70 && isolationPreventionRate >= 40 && totalIsolationRecords > 0) {
    concerns.push(
      `Isolation prevention effectiveness at ${isolationPreventionRate}% — not all interventions are achieving positive outcomes for at-risk children. Review is needed to ensure approaches match individual needs.`,
    );
  }

  if (childSatisfactionRate < 50 && totalSurveys > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% of children report satisfaction with their friendships — most children are unhappy with their social connections, indicating significant unmet social needs.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 50 && totalSurveys > 0) {
    concerns.push(
      `Child satisfaction with friendships at ${childSatisfactionRate}% — a notable proportion of children are not satisfied with the quality of their friendships.`,
    );
  }

  if (lonelinessRate > 50 && totalSurveys > 0) {
    concerns.push(
      `${lonelinessRate}% of children report feeling lonely — the majority of children feel socially isolated, representing a critical failure in the home's duty to foster positive social relationships.`,
    );
  } else if (lonelinessRate > 25 && lonelinessRate <= 50 && totalSurveys > 0) {
    concerns.push(
      `${lonelinessRate}% of children report feeling lonely — a significant minority of children feel socially isolated and require urgent attention.`,
    );
  } else if (lonelinessRate > 10 && lonelinessRate <= 25 && totalSurveys > 0) {
    concerns.push(
      `${lonelinessRate}% of children report feeling lonely — some children feel socially isolated and their wellbeing may be affected.`,
    );
  }

  if (childConfidenceRate < 50 && totalSurveys > 0) {
    concerns.push(
      `Only ${childConfidenceRate}% of children report confidence in social situations — most children lack social confidence, which may impede their ability to form and maintain friendships.`,
    );
  } else if (childConfidenceRate < 70 && childConfidenceRate >= 50 && totalSurveys > 0) {
    concerns.push(
      `Social confidence at ${childConfidenceRate}% — a significant proportion of children do not feel confident in social situations.`,
    );
  }

  if (noFriendsRate > 20 && totalMappings > 0) {
    concerns.push(
      `${noFriendsRate}% of children have no identified friends — children without any friends are at high risk of social isolation and poor emotional wellbeing.`,
    );
  } else if (noFriendsRate > 0 && noFriendsRate <= 20 && totalMappings > 0) {
    concerns.push(
      `${childrenWithNoFriends} child${childrenWithNoFriends !== 1 ? "ren have" : " has"} no identified friends — any child without friends requires targeted friendship facilitation support.`,
    );
  }

  if (below(avgFriendshipQuality, 2.5) && totalMappings > 0) {
    concerns.push(
      `Average friendship quality rating of ${avgFriendshipQuality}/5 — the quality of children's friendships is poor, suggesting relationships may be superficial, conflictual, or unsupportive.`,
    );
  } else if (below(avgFriendshipQuality, 3.0) && meets(avgFriendshipQuality, 2.5) && totalMappings > 0) {
    concerns.push(
      `Average friendship quality rating of ${avgFriendshipQuality}/5 — friendship quality is below the standard expected, indicating some children's relationships may not be providing adequate emotional support.`,
    );
  }

  if (decliningNetworkRate > 30 && totalNetworks > 0) {
    concerns.push(
      `${decliningNetworkRate}% of children's social networks are declining or volatile — a significant proportion of children are losing social connections, which may indicate placement-related disruption.`,
    );
  }

  if (overdueMappingReviews > 0 && totalMappings > 0) {
    concerns.push(
      `${overdueMappingReviews} friendship mapping review${overdueMappingReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, mappings may not reflect children's current friendship landscape.`,
    );
  }

  if (overdueNetworkReviews > 0 && totalNetworks > 0) {
    concerns.push(
      `${overdueNetworkReviews} social network review${overdueNetworkReviews !== 1 ? "s are" : " is"} overdue — network assessments must be kept current to track changes in children's social support systems.`,
    );
  }

  if (overdueIsolationReviews > 0 && activeIsolationInterventions > 0) {
    concerns.push(
      `${overdueIsolationReviews} active isolation intervention review${overdueIsolationReviews !== 1 ? "s are" : " is"} overdue — interventions for at-risk children must be regularly reviewed to ensure they remain effective.`,
    );
  }

  if (highRiskIsolation > 0) {
    concerns.push(
      `${highRiskIsolation} child${highRiskIsolation !== 1 ? "ren" : ""} currently at high risk of social isolation with active interventions — these cases require close monitoring and potentially enhanced support.`,
    );
  }

  if (outsideFriendshipRate < 40 && totalMappings > 0) {
    concerns.push(
      `Only ${outsideFriendshipRate}% of children have friendships outside the home — limited external social connections suggest the home may not be adequately supporting community engagement.`,
    );
  }

  if (wantMoreSocialRate > 50 && totalSurveys > 0) {
    concerns.push(
      `${wantMoreSocialRate}% of children want more social opportunities — children are telling the home they need more chances to socialise, and this feedback should drive changes to provision.`,
    );
  }

  if (below(barrierSupportRate, 50) && networksWithBarriers > 0) {
    concerns.push(
      `Only ${barrierSupportRate}% of identified social barriers have support in place — where barriers to social connection have been identified, the home is not consistently responding with appropriate support.`,
    );
  }

  if (peerDocumentationRate < 70 && totalPeerActivities > 0) {
    concerns.push(
      `Peer activity documentation at only ${peerDocumentationRate}% — poor recording makes it difficult to evidence the purpose and outcomes of social development work.`,
    );
  }

  if (highRiskEscalationRate < 50 && highRiskTotal > 0) {
    concerns.push(
      `Only ${highRiskEscalationRate}% of high-risk isolation cases escalated to professionals — children at high risk of social isolation require specialist input to ensure adequate support.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FriendshipSocialRecommendation[] = [];
  let rank = 0;

  if (friendshipMappingRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently complete friendship mapping assessments for all children — every child's friendship network must be formally assessed to enable targeted social support and evidence that the home understands each child's social needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (lonelinessRate > 50 && totalSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address widespread loneliness — when the majority of children report feeling lonely, the home must immediately review its social environment, increase structured social opportunities, and develop individual friendship facilitation plans for every child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (isolationPreventionRate < 40 && totalIsolationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign ineffective isolation prevention interventions — when the majority of interventions are not achieving improvement, the approach needs fundamental reassessment with specialist professional input to ensure at-risk children receive effective support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (socialNetworkRate < 50 && social_network_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently extend social network assessments to all children — formal assessment of each child's broader social connections is essential to identify gaps, barriers, and opportunities for strengthening their support network.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (childSatisfactionRate < 50 && totalSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review friendship support provision with children to understand why they are not satisfied — adapt the home's approach based on children's direct feedback to ensure social support genuinely meets their needs and aspirations.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (highRiskEscalationRate < 50 && highRiskTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all high-risk isolation cases are escalated to appropriate professionals — children at high risk of social isolation may need therapeutic support, specialist social skills programmes, or CAMHS referral.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (noFriendsRate > 20 && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop individual friendship facilitation plans for children with no identified friends — these children require proactive, structured support to build social connections both within and outside the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (below(barrierSupportRate, 50) && networksWithBarriers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all identified barriers to social connection — where barriers have been identified but support not provided, the home is failing to act on known obstacles to children's social development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (lonelinessRate > 25 && lonelinessRate <= 50 && totalSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address loneliness among children reporting social isolation — implement individual friendship support plans and increase structured social opportunities to ensure every child feels connected.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (overdueMappingReviews > 0 && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue friendship mapping reviews — children's friendships change frequently and mappings must be kept current to ensure support remains relevant and effective.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (overdueIsolationReviews > 0 && activeIsolationInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue isolation intervention reviews — without timely review, the home cannot ensure interventions remain appropriate and effective for at-risk children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (
    friendshipMappingRate >= 50 &&
    friendshipMappingRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend friendship mapping coverage to all children — aim for 100% coverage to ensure every child's social network is formally understood and support can be individually tailored.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (
    socialNetworkRate >= 50 &&
    socialNetworkRate < 80 &&
    social_network_records.length > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase social network assessment coverage to at least 80% — broader coverage enables the home to identify at-risk children and strengthen their social support systems.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (
    isolationPreventionRate >= 40 &&
    isolationPreventionRate < 70 &&
    totalIsolationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review isolation prevention interventions that are not showing improvement — consider whether different approaches, increased professional input, or adjusted goals would better support each child's social integration.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (outsideFriendshipRate < 60 && outsideFriendshipRate >= 40 && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase support for children to develop friendships outside the home — facilitate community activities, school-based social opportunities, and extracurricular clubs to broaden children's social networks beyond the care setting.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (wantMoreSocialRate > 50 && totalSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Respond to children's requests for more social opportunities — increase the range and frequency of social activities available, ensuring they are shaped by children's own interests and preferences.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (childConfidenceRate < 70 && totalSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured social confidence-building programmes — children who lack social confidence may benefit from social skills groups, drama therapy, or supported social activities that gradually build their comfort in social situations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (childInvolvementRate < 70 && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in friendship mapping assessments — children must be active participants in describing their own friendships and social experiences to ensure assessments are accurate and meaningful.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (peerDocumentationRate < 70 && totalPeerActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of peer support activities — each activity should have recorded notes detailing purpose, engagement, and outcomes to evidence the home's investment in social development.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (
    peerSupportRate >= 40 &&
    peerSupportRate < 60 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase peer support activity participation — aim for at least 60% of children engaging in structured social activities to ensure all children have access to supported social development opportunities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalSurveys > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to improve children's satisfaction with friendships — regularly seek children's views on what would help them build better friendships and adapt provision accordingly.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (decliningNetworkRate > 30 && totalNetworks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and address declining social networks — when children are losing connections, identify the causes (placement change, school move, conflict) and provide targeted support to rebuild and stabilise networks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FriendshipSocialInsight[] = [];

  // -- Critical insights --

  if (friendshipMappingRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${friendshipMappingRate}% of children have friendship mappings. Without formal assessment of each child's friendships, the home cannot demonstrate it understands or actively supports children's social connections. Ofsted expects evidence that children are helped to develop positive relationships under Reg 11.`,
      severity: "critical",
    });
  }

  if (lonelinessRate > 50 && totalSurveys > 0) {
    insights.push({
      text: `${lonelinessRate}% of children report feeling lonely. When the majority of children feel socially isolated, this represents a fundamental failure in the home's social environment. Loneliness in care significantly impacts children's emotional wellbeing, mental health, and placement stability. This requires immediate, systemic intervention.`,
      severity: "critical",
    });
  }

  if (isolationPreventionRate < 40 && totalIsolationRecords > 0) {
    insights.push({
      text: `Only ${isolationPreventionRate}% of isolation prevention interventions showing improvement. When most interventions for at-risk children are not working, this indicates a systemic failure in the home's approach to social isolation — interventions may be poorly designed, inconsistently delivered, or mismatched to individual needs.`,
      severity: "critical",
    });
  }

  if (socialNetworkRate < 50 && social_network_records.length > 0) {
    insights.push({
      text: `Only ${socialNetworkRate}% of children have social network assessments. Without understanding each child's broader social support system, the home cannot identify isolated children or take proactive steps to strengthen weak networks. This undermines the home's ability to evidence compliance with Reg 5.`,
      severity: "critical",
    });
  }

  if (noFriendsRate > 20 && totalMappings > 0) {
    insights.push({
      text: `${noFriendsRate}% of children have no identified friends. Children without any friendships are at severe risk of social isolation, poor emotional wellbeing, and placement breakdown. Each of these children needs an individual friendship facilitation plan with professional input.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 50 && totalSurveys > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% of children are satisfied with their friendships. When most children are unhappy with their social connections, the home must treat this as a priority safeguarding and wellbeing concern. Children's own assessment of their friendships is the most authentic measure of social support quality.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    friendshipMappingRate >= 50 &&
    friendshipMappingRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Friendship mapping coverage at ${friendshipMappingRate}% — improving but some children still lack a formal friendship assessment. Each unassessed child may have unidentified social needs affecting their wellbeing and social development.`,
      severity: "warning",
    });
  }

  if (
    socialNetworkRate >= 50 &&
    socialNetworkRate < 80 &&
    social_network_records.length > 0
  ) {
    insights.push({
      text: `Social network coverage at ${socialNetworkRate}% — some children still lack a formal assessment of their broader social connections. Incomplete coverage may mean isolated or vulnerable children are not being identified.`,
      severity: "warning",
    });
  }

  if (
    isolationPreventionRate >= 40 &&
    isolationPreventionRate < 70 &&
    totalIsolationRecords > 0
  ) {
    insights.push({
      text: `Isolation prevention effectiveness at ${isolationPreventionRate}% — some interventions are not achieving the expected improvement. Consider whether the approach, intensity, or goals need adjustment for individual children.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalSurveys > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children are not satisfied with their friendships. Children's subjective experience of their social connections is the most important measure of whether the home is succeeding in fostering positive relationships.`,
      severity: "warning",
    });
  }

  if (lonelinessRate > 10 && lonelinessRate <= 50 && totalSurveys > 0) {
    insights.push({
      text: `${lonelinessRate}% of children report feeling lonely. Any level of loneliness among looked-after children is concerning. Loneliness correlates strongly with poor mental health outcomes and should be treated as an early warning indicator requiring proactive intervention.`,
      severity: "warning",
    });
  }

  if (
    childConfidenceRate >= 50 &&
    childConfidenceRate < 70 &&
    totalSurveys > 0
  ) {
    insights.push({
      text: `Social confidence at ${childConfidenceRate}% — some children lack confidence in social situations, which may limit their ability to form and maintain friendships. Social skills development and confidence-building activities may help.`,
      severity: "warning",
    });
  }

  if (decliningNetworkRate > 30 && totalNetworks > 0) {
    insights.push({
      text: `${decliningNetworkRate}% of children's social networks are declining or volatile. Losing social connections can be deeply destabilising for looked-after children, who may have already experienced significant relationship loss. This trend warrants investigation.`,
      severity: "warning",
    });
  }

  if (overdueMappingReviews > 0 && totalMappings > 0) {
    insights.push({
      text: `${overdueMappingReviews} friendship mapping review${overdueMappingReviews !== 1 ? "s" : ""} overdue. Children's friendships evolve rapidly, and out-of-date mappings may lead to support that no longer reflects their current social reality.`,
      severity: "warning",
    });
  }

  if (overdueIsolationReviews > 0 && activeIsolationInterventions > 0) {
    insights.push({
      text: `${overdueIsolationReviews} active isolation intervention${overdueIsolationReviews !== 1 ? "s have" : " has"} overdue reviews. Without timely review, ineffective interventions may continue unchanged while at-risk children's social isolation persists or deepens.`,
      severity: "warning",
    });
  }

  if (wantMoreSocialRate > 50 && totalSurveys > 0) {
    insights.push({
      text: `${wantMoreSocialRate}% of children want more social opportunities. When children themselves are requesting more chances to socialise, the home has a clear mandate to increase provision. Acting on this feedback demonstrates genuine child-centred care.`,
      severity: "warning",
    });
  }

  if (outsideFriendshipRate < 40 && totalMappings > 0) {
    insights.push({
      text: `Only ${outsideFriendshipRate}% of children have friendships outside the home. Limited external connections may indicate the home is not adequately supporting children's engagement with the wider community, school peers, and neighbourhood social networks as expected under Reg 5.`,
      severity: "warning",
    });
  }

  if (
    meets(avgFriendshipQuality, 2.5) &&
    below(avgFriendshipQuality, 3.0) &&
    totalMappings > 0
  ) {
    insights.push({
      text: `Average friendship quality at ${avgFriendshipQuality}/5 — while children have friendships, the quality could be improved. Consider whether support is needed to help children develop deeper, more meaningful relationships.`,
      severity: "warning",
    });
  }

  if (
    barrierRate > 30 &&
    totalNetworks > 0
  ) {
    insights.push({
      text: `${barrierRate}% of social network assessments identify barriers to social connection. A high proportion of children face obstacles to developing their social networks. Common barriers include placement distance, lack of transport, limited community activities, and digital exclusion.`,
      severity: "warning",
    });
  }

  // -- Analysis: peer activity types --
  const activityTypeCounts: Record<string, number> = {};
  for (const pa of peer_support_records) {
    activityTypeCounts[pa.activity_type] = (activityTypeCounts[pa.activity_type] ?? 0) + 1;
  }
  const topActivityTypes = Object.entries(activityTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topActivityTypes.length > 0 && totalPeerActivities >= 3) {
    const typeStr = topActivityTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Peer support activity profile: ${typeStr}. Consider whether the mix of activities reflects the diverse social needs of all children, including those who may prefer quieter, smaller-group interactions.`,
      severity: "warning",
    });
  }

  // -- Analysis: isolation intervention types --
  const isolationTypeCounts: Record<string, number> = {};
  for (const iv of isolation_prevention_records.filter((i) => i.intervention_active)) {
    isolationTypeCounts[iv.intervention_type] = (isolationTypeCounts[iv.intervention_type] ?? 0) + 1;
  }
  const topIsolationTypes = Object.entries(isolationTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topIsolationTypes.length > 0 && activeIsolationInterventions >= 3) {
    const ivStr = topIsolationTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Active isolation intervention types: ${ivStr}. A diverse intervention approach suggests the home tailors its response to individual children's isolation risks rather than using a one-size-fits-all model.`,
      severity: "warning",
    });
  }

  // -- Analysis: network types --
  const networkTypeCounts: Record<string, number> = {};
  for (const nw of social_network_records) {
    networkTypeCounts[nw.network_type] = (networkTypeCounts[nw.network_type] ?? 0) + 1;
  }
  const topNetworkTypes = Object.entries(networkTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topNetworkTypes.length > 0 && totalNetworks >= 3) {
    const nwStr = topNetworkTypes
      .map(([t, c]) => `${t} (${c})`)
      .join(", ");
    insights.push({
      text: `Social network type distribution: ${nwStr}. Ensure assessments cover all network domains — family, peer, community, school, professional, and online — to build a complete picture of each child's social support system.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (friendship_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding friendship and social network support — children's friendships are comprehensively mapped, social networks are assessed, peer support is well-delivered, isolation is proactively prevented, and children report high satisfaction with their social connections. This is strong evidence of child-centred care under Reg 11.",
      severity: "positive",
    });
  }

  if (
    friendshipMappingRate >= 100 &&
    childInvolvementRate >= 90 &&
    total_children > 0 &&
    totalMappings > 0
  ) {
    insights.push({
      text: "Every child has a friendship mapping with high levels of child involvement — the home excels at understanding each child's social world through participatory assessment, ensuring support is genuinely child-centred.",
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 90 &&
    lonelinessRate === 0 &&
    totalSurveys > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% satisfaction with friendships and no child reports feeling lonely — the home has created an exceptional social environment where children feel genuinely connected and supported.`,
      severity: "positive",
    });
  }

  if (
    isolationPreventionRate >= 90 &&
    highRiskEscalationRate >= 100 &&
    totalIsolationRecords > 0 &&
    highRiskTotal > 0
  ) {
    insights.push({
      text: `${isolationPreventionRate}% of isolation interventions improving with all high-risk cases escalated to professionals — the home demonstrates exemplary practice in identifying, supporting, and safeguarding socially isolated children.`,
      severity: "positive",
    });
  }

  if (
    networkPositivityRate >= 90 &&
    networkStabilityRate >= 80 &&
    totalNetworks > 0
  ) {
    insights.push({
      text: `${networkPositivityRate}% positive contacts with ${networkStabilityRate}% stable/growing networks — children are predominantly surrounded by supportive people, and their social connections are being maintained and strengthened over time.`,
      severity: "positive",
    });
  }

  if (
    peerSupportRate >= 80 &&
    peerEnjoymentRate >= 90 &&
    total_children > 0 &&
    totalPeerActivities > 0
  ) {
    insights.push({
      text: `${peerSupportRate}% of children in peer support with ${peerEnjoymentRate}% reporting enjoyment — the home delivers engaging, well-received social activities that children genuinely value.`,
      severity: "positive",
    });
  }

  if (
    outsideFriendshipRate >= 80 &&
    totalMappings > 0
  ) {
    insights.push({
      text: `${outsideFriendshipRate}% of children have friendships outside the home — the home excels at supporting children to maintain and develop social connections in the wider community, demonstrating strong compliance with Reg 5.`,
      severity: "positive",
    });
  }

  if (
    bestFriendRate >= 80 &&
    meets(avgFriendshipQuality, 4.0) &&
    totalSurveys > 0 &&
    totalMappings > 0
  ) {
    insights.push({
      text: `${bestFriendRate}% of children have a best friend with average friendship quality of ${avgFriendshipQuality}/5 — children are forming deep, meaningful attachments that provide genuine emotional support and companionship.`,
      severity: "positive",
    });
  }

  if (
    staffSupportRate >= 90 &&
    inclusionRate >= 90 &&
    totalSurveys > 0
  ) {
    insights.push({
      text: `${staffSupportRate}% feel supported by staff and ${inclusionRate}% feel included — staff are creating a nurturing, inclusive social environment where every child feels they belong and are actively supported in their friendships.`,
      severity: "positive",
    });
  }

  if (
    meets(barrierSupportRate, 90) &&
    networksWithBarriers > 0
  ) {
    insights.push({
      text: `${barrierSupportRate}% of identified social barriers have support in place — the home responds proactively and comprehensively when children face obstacles to forming social connections, removing barriers rather than letting them persist.`,
      severity: "positive",
    });
  }

  if (
    childConfidenceRate >= 90 &&
    totalSurveys > 0
  ) {
    insights.push({
      text: `${childConfidenceRate}% of children report high social confidence — children feel empowered and capable in social situations, reflecting effective social skills development and a supportive social environment.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (friendship_rating === "outstanding") {
    headline =
      "Outstanding friendship and social network support — children's friendships are comprehensively mapped, social connections are strong, and children report high satisfaction with their social lives.";
  } else if (friendship_rating === "good") {
    headline = `Good friendship and social network support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (friendship_rating === "adequate") {
    headline = `Adequate friendship and social network support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children develop and maintain positive social relationships.`;
  } else {
    headline = `Friendship and social network support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's social needs are met and isolation is prevented.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    friendship_rating,
    friendship_score: score,
    headline,
    total_mappings: totalMappings,
    friendship_mapping_rate: friendshipMappingRate,
    social_network_rate: socialNetworkRate,
    peer_support_rate: peerSupportRate,
    isolation_prevention_rate: isolationPreventionRate,
    child_satisfaction_rate: childSatisfactionRate,
    child_confidence_rate: childConfidenceRate,
    avg_friends_per_child: avgFriendsPerChild,
    avg_friendship_quality: avgFriendshipQuality,
    network_positivity_rate: networkPositivityRate,
    peer_engagement_avg: peerEngagementAvg,
    isolation_high_risk_count: highRiskIsolation,
    loneliness_rate: lonelinessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
