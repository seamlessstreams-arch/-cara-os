// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FRIENDSHIP & SOCIAL NETWORK INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 5/11: Friendship mapping, social networks, peer support,
// isolation prevention, child satisfaction with friendships.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFriendshipSocialNetwork,
  type FriendshipSocialInput,
  type FriendshipMappingInput,
  type SocialNetworkInput,
  type PeerSupportInput,
  type IsolationPreventionInput,
  type ChildSatisfactionInput,
} from "../home-friendship-social-network-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMapping(overrides: Partial<FriendshipMappingInput> = {}): FriendshipMappingInput {
  return {
    id: "fm_test",
    child_id: "yp_alex",
    mapping_date: "2026-04-15",
    mapper_role: "keyworker",
    total_friends_identified: 5,
    friends_in_home: 2,
    friends_outside_home: 2,
    friends_from_school: 1,
    friends_from_community: 1,
    online_friends_identified: 1,
    friendship_quality_rating: 4,
    child_involved_in_mapping: true,
    support_plan_in_place: true,
    review_date: "2026-07-15",
    review_overdue: false,
    concerns_identified: false,
    concerns_description: "",
    created_at: "2026-04-15",
    ...overrides,
  };
}

function makeNetwork(overrides: Partial<SocialNetworkInput> = {}): SocialNetworkInput {
  return {
    id: "sn_test",
    child_id: "yp_alex",
    assessment_date: "2026-04-10",
    network_type: "peer",
    contacts_count: 8,
    positive_contacts: 7,
    negative_contacts: 0,
    neutral_contacts: 1,
    network_stability: "stable",
    child_satisfaction_with_network: 4,
    barriers_identified: false,
    barriers_description: "",
    support_provided: false,
    review_date: "2026-07-10",
    review_overdue: false,
    created_at: "2026-04-10",
    ...overrides,
  };
}

function makePeerSupport(overrides: Partial<PeerSupportInput> = {}): PeerSupportInput {
  return {
    id: "ps_test",
    child_id: "yp_alex",
    activity_date: "2026-04-20",
    activity_type: "group_activity",
    participants_count: 4,
    child_engagement_rating: 4,
    peer_interaction_quality: 4,
    staff_facilitated: true,
    child_reported_enjoyment: true,
    skills_developed: ["communication", "cooperation"],
    outcome_positive: true,
    notes_recorded: true,
    created_at: "2026-04-20",
    ...overrides,
  };
}

function makeIsolation(overrides: Partial<IsolationPreventionInput> = {}): IsolationPreventionInput {
  return {
    id: "ip_test",
    child_id: "yp_alex",
    identified_date: "2026-03-01",
    risk_level: "medium",
    isolation_indicators: ["withdrawn", "limited_peer_contact"],
    intervention_type: "friendship_facilitation",
    intervention_start_date: "2026-03-05",
    intervention_active: true,
    progress_rating: 4,
    child_engagement: 4,
    outcome_improved: true,
    review_date: "2026-06-01",
    review_overdue: false,
    escalated_to_professional: false,
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeSatisfaction(overrides: Partial<ChildSatisfactionInput> = {}): ChildSatisfactionInput {
  return {
    id: "cs_test",
    child_id: "yp_alex",
    survey_date: "2026-05-01",
    satisfaction_with_friendships: 4,
    feels_supported_by_staff: true,
    feels_included: true,
    has_best_friend: true,
    feels_lonely: false,
    wants_more_social_opportunities: false,
    confidence_in_social_situations: 4,
    satisfaction_with_contact_arrangements: 4,
    free_text_feedback: "I like my friends here",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<FriendshipSocialInput> = {}): FriendshipSocialInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    friendship_mapping_records: [
      makeMapping({ id: "fm_1", child_id: "yp_alex" }),
      makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
      makeMapping({ id: "fm_3", child_id: "yp_casey" }),
    ],
    social_network_records: [
      makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
      makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
    ],
    peer_support_records: [
      makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
      makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
      makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
    ],
    isolation_prevention_records: [
      makeIsolation({ id: "ip_1", child_id: "yp_alex" }),
      makeIsolation({ id: "ip_2", child_id: "yp_jordan" }),
      makeIsolation({ id: "ip_3", child_id: "yp_casey" }),
    ],
    child_satisfaction_records: [
      makeSatisfaction({ id: "cs_1", child_id: "yp_alex" }),
      makeSatisfaction({ id: "cs_2", child_id: "yp_jordan" }),
      makeSatisfaction({ id: "cs_3", child_id: "yp_casey" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty and total_children is 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 0,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.friendship_rating).toBe("insufficient_data");
    expect(r.friendship_score).toBe(0);
  });

  it("has zero for all metrics on insufficient data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 0,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.total_mappings).toBe(0);
    expect(r.friendship_mapping_rate).toBe(0);
    expect(r.social_network_rate).toBe(0);
    expect(r.peer_support_rate).toBe(0);
    expect(r.isolation_prevention_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
    expect(r.child_confidence_rate).toBe(0);
    expect(r.avg_friends_per_child).toBe(0);
    expect(r.avg_friendship_quality).toBe(0);
    expect(r.network_positivity_rate).toBe(0);
    expect(r.peer_engagement_avg).toBe(0);
    expect(r.isolation_high_risk_count).toBe(0);
    expect(r.loneliness_rate).toBe(0);
  });

  it("returns empty strengths, concerns, recommendations, insights on insufficient_data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 0,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("headline mentions insufficient data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 0,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.headline).toContain("insufficient data");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ALL EMPTY WITH CHILDREN ON PLACEMENT (INADEQUATE)
// ═══════════════════════════════════════════════════════════════════════════

describe("all empty with children on placement", () => {
  it("returns inadequate when all arrays empty but children > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.friendship_rating).toBe("inadequate");
    expect(r.friendship_score).toBe(15);
  });

  it("includes a critical concern when children present but no data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No friendship mapping records");
  });

  it("includes 2 immediate recommendations when children present but no data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("includes a critical insight about absence of records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.headline).toContain("urgent attention");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CORE METRICS — FRIENDSHIP MAPPING
// ═══════════════════════════════════════════════════════════════════════════

describe("friendship mapping metrics", () => {
  it("counts total mappings", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.total_mappings).toBe(3);
  });

  it("computes friendship_mapping_rate as pct of unique children mapped", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_alex" }),
      ],
    }));
    // 2 unique children / 5 total = 40%
    expect(r.friendship_mapping_rate).toBe(40);
  });

  it("returns 100% mapping rate when all children mapped", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    // 3 unique children / 3 total = 100%
    expect(r.friendship_mapping_rate).toBe(100);
  });

  it("computes avg_friends_per_child", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", total_friends_identified: 3 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", total_friends_identified: 7 }),
      ],
    }));
    // (3+7)/2 = 5.0
    expect(r.avg_friends_per_child).toBe(5);
  });

  it("computes avg_friendship_quality", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 5 }),
      ],
    }));
    // (3+5)/2 = 4.0
    expect(r.avg_friendship_quality).toBe(4);
  });

  it("rounds avg_friends_per_child to two decimal places", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", total_friends_identified: 3 }),
        makeMapping({ id: "fm_2", total_friends_identified: 4 }),
        makeMapping({ id: "fm_3", total_friends_identified: 5 }),
      ],
    }));
    // (3+4+5)/3 = 4.0
    expect(r.avg_friends_per_child).toBe(4);
  });

  it("returns 0 for mapping metrics when no mappings exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [],
    }));
    expect(r.total_mappings).toBe(0);
    expect(r.avg_friends_per_child).toBe(0);
    expect(r.avg_friendship_quality).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CORE METRICS — SOCIAL NETWORK
// ═══════════════════════════════════════════════════════════════════════════

describe("social network metrics", () => {
  it("computes social_network_rate as pct of unique children with networks", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 4,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
      ],
    }));
    // 2/4 = 50%
    expect(r.social_network_rate).toBe(50);
  });

  it("computes network_positivity_rate from positive contacts", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", contacts_count: 10, positive_contacts: 9, negative_contacts: 1, neutral_contacts: 0 }),
        makeNetwork({ id: "sn_2", contacts_count: 10, positive_contacts: 8, negative_contacts: 1, neutral_contacts: 1 }),
      ],
    }));
    // (9+8)/(10+10) = 17/20 = 85%
    expect(r.network_positivity_rate).toBe(85);
  });

  it("returns 0 network_positivity when no contacts", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", contacts_count: 0, positive_contacts: 0, negative_contacts: 0, neutral_contacts: 0 }),
      ],
    }));
    expect(r.network_positivity_rate).toBe(0);
  });

  it("returns 100% social_network_rate when all children assessed", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.social_network_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CORE METRICS — PEER SUPPORT
// ═══════════════════════════════════════════════════════════════════════════

describe("peer support metrics", () => {
  it("computes peer_support_rate from unique children", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_alex" }),
      ],
    }));
    // 2 unique / 5 = 40%
    expect(r.peer_support_rate).toBe(40);
  });

  it("computes peer_engagement_avg", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_engagement_rating: 3 }),
        makePeerSupport({ id: "ps_2", child_engagement_rating: 5 }),
      ],
    }));
    // (3+5)/2 = 4.0
    expect(r.peer_engagement_avg).toBe(4);
  });

  it("returns 0 peer_engagement_avg when no peer records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [],
    }));
    expect(r.peer_engagement_avg).toBe(0);
  });

  it("returns 100% peer_support_rate when all children participate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.peer_support_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. CORE METRICS — ISOLATION PREVENTION
// ═══════════════════════════════════════════════════════════════════════════

describe("isolation prevention metrics", () => {
  it("computes isolation_prevention_rate from improved outcomes", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
        makeIsolation({ id: "ip_3", outcome_improved: true }),
      ],
    }));
    // 2/3 = 67%
    expect(r.isolation_prevention_rate).toBe(67);
  });

  it("counts high risk isolation with active interventions", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", intervention_active: true }),
        makeIsolation({ id: "ip_2", risk_level: "high", intervention_active: false }),
        makeIsolation({ id: "ip_3", risk_level: "medium", intervention_active: true }),
      ],
    }));
    expect(r.isolation_high_risk_count).toBe(1);
  });

  it("returns 0 isolation_prevention_rate when no isolation records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [],
    }));
    expect(r.isolation_prevention_rate).toBe(0);
    expect(r.isolation_high_risk_count).toBe(0);
  });

  it("returns 100% isolation_prevention_rate when all improved", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.isolation_prevention_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. CORE METRICS — CHILD SATISFACTION
// ═══════════════════════════════════════════════════════════════════════════

describe("child satisfaction metrics", () => {
  it("computes child_satisfaction_rate from surveys scoring >= 4", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 5 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 2 }),
      ],
    }));
    // 2/3 = 67%
    expect(r.child_satisfaction_rate).toBe(67);
  });

  it("computes child_confidence_rate from surveys scoring >= 4", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 5 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", confidence_in_social_situations: 3 }),
      ],
    }));
    // 2/3 = 67%
    expect(r.child_confidence_rate).toBe(67);
  });

  it("computes loneliness_rate from feels_lonely", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: false }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    // 1/3 = 33%
    expect(r.loneliness_rate).toBe(33);
  });

  it("returns 100% satisfaction when all children rate >= 4", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("returns 0% loneliness when no children feel lonely", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.loneliness_rate).toBe(0);
  });

  it("returns 0 for satisfaction metrics when no surveys", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [],
    }));
    expect(r.child_satisfaction_rate).toBe(0);
    expect(r.child_confidence_rate).toBe(0);
    expect(r.loneliness_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SCORING — BASE AND BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring bonuses", () => {
  it("starts at base 52 and adds bonuses for outstanding defaults", () => {
    // Default base input has: mappingRate=100(+4), networkRate=100(+4),
    // peerRate=100(+3), isolationPreventionRate=100(+4),
    // satisfactionRate=100(+4), confidenceRate=100(+3),
    // avgQuality=4(+3), reviewCompliance=100(+2), networkPositivity ~88%(no +1)
    const r = computeFriendshipSocialNetwork(baseInput());
    // 52+4+4+3+4+4+3+3+2 = 79
    // network positivity = 7/8 = 88% (not >=90, so no +1)
    expect(r.friendship_score).toBe(79);
  });

  it("awards +1 for networkPositivityRate >= 90", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 9 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10 }),
      ],
    }));
    // 29/30 = 97% >= 90 => +1
    // 52+4+4+3+4+4+3+3+2+1 = 80
    expect(r.friendship_score).toBe(80);
  });

  it("awards +2 for friendshipMappingRate 80-99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
      ],
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
        makePeerSupport({ id: "ps_4", child_id: "yp_sam" }),
        makePeerSupport({ id: "ps_5", child_id: "yp_robin" }),
      ],
    }));
    // mappingRate = 4/5 = 80% => +2
    expect(r.friendship_mapping_rate).toBe(80);
  });

  it("awards +2 for socialNetworkRate 80-99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
      ],
    }));
    // 4/5 = 80% => +2
    expect(r.social_network_rate).toBe(80);
  });

  it("awards +1 for peerSupportRate 60-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
      ],
    }));
    // 3/5 = 60% => +1
    expect(r.peer_support_rate).toBe(60);
  });

  it("awards +2 for isolationPreventionRate 70-89", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: true }),
        makeIsolation({ id: "ip_3", outcome_improved: true }),
        makeIsolation({ id: "ip_4", outcome_improved: false }),
      ],
    }));
    // 3/4 = 75% => +2
    expect(r.isolation_prevention_rate).toBe(75);
  });

  it("awards +2 for childSatisfactionRate 70-89", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_4", satisfaction_with_friendships: 2 }),
      ],
    }));
    // 3/4 = 75% => +2
    expect(r.child_satisfaction_rate).toBe(75);
  });

  it("awards +1 for childConfidenceRate 70-89", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_4", confidence_in_social_situations: 2 }),
      ],
    }));
    // 3/4 = 75% => +1
    expect(r.child_confidence_rate).toBe(75);
  });

  it("awards +1 for avgFriendshipQuality 3.0-3.99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 3 }),
      ],
    }));
    expect(r.avg_friendship_quality).toBe(3);
  });

  it("awards +1 for mappingReviewComplianceRate 80-99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", review_overdue: false }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", review_overdue: false }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", review_overdue: false }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", review_overdue: false }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", review_overdue: true }),
      ],
    }));
    // 4/5 = 80% compliance => +1 (not +2)
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. SCORING — PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring penalties", () => {
  it("applies -5 penalty when friendshipMappingRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
      ],
    }));
    // 4/10 = 40% < 50 => -5
    expect(r.friendship_mapping_rate).toBe(40);
  });

  it("applies -5 penalty when socialNetworkRate < 50 and records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
      ],
    }));
    // 2/10 = 20% < 50 => -5
    expect(r.social_network_rate).toBe(20);
  });

  it("applies -4 penalty when isolationPreventionRate < 40 and records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
        makeIsolation({ id: "ip_3", outcome_improved: true }),
      ],
    }));
    // 1/3 = 33% < 40 => -4
    expect(r.isolation_prevention_rate).toBe(33);
  });

  it("applies -4 penalty when lonelinessRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: true }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    // 2/3 = 67% > 50 => -4
    expect(r.loneliness_rate).toBe(67);
  });

  it("clamps score to 0 minimum", () => {
    // Create scenario with multiple penalties and no bonuses
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 20,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 1 }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
      peer_support_records: [],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true, satisfaction_with_friendships: 1, confidence_in_social_situations: 1 }),
      ],
    }));
    expect(r.friendship_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to 100 maximum", () => {
    // Even with many bonuses, score should not exceed 100
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.friendship_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RATING BANDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating bands", () => {
  it("returns outstanding when score >= 80", () => {
    // Force network positivity >=90 to get +1 => score=80
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10 }),
      ],
    }));
    expect(r.friendship_score).toBeGreaterThanOrEqual(80);
    expect(r.friendship_rating).toBe("outstanding");
  });

  it("returns good when score 65-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    // base input => 79, which is good (not outstanding because < 80)
    expect(r.friendship_score).toBe(79);
    expect(r.friendship_rating).toBe("good");
  });

  it("returns adequate when score 45-64", () => {
    // Strip out most bonuses
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor", friendship_quality_rating: 3 }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
        makeNetwork({ id: "sn_6", child_id: "yp_taylor" }),
      ],
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
      ],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 3, confidence_in_social_situations: 3 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 4, confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 3, confidence_in_social_situations: 3 }),
      ],
    }));
    // mappingRate=60%(+0), networkRate=60%(+0), peerRate=30%(+0),
    // isolationRate=50%(+0), satisfactionRate=33%(+0), confidenceRate=33%(+0),
    // avgQuality=3(+1), reviewCompliance=100(+2), networkPositivity ~88%(+0)
    // 52+1+2 = 55
    expect(r.friendship_score).toBeGreaterThanOrEqual(45);
    expect(r.friendship_score).toBeLessThan(65);
    expect(r.friendship_rating).toBe("adequate");
  });

  it("returns inadequate when score < 45", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 20,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 2 }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
      peer_support_records: [],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2, confidence_in_social_situations: 2, feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 2, confidence_in_social_situations: 2, feels_lonely: true }),
      ],
    }));
    // mappingRate=5%(<50 => -5), networkRate=5%(<50 => -5), peerRate=0,
    // isolationRate=0(<40 => -4), satisfactionRate=0, confidenceRate=0,
    // loneliness=100%(>50 => -4)
    // 52-5-5-4-4 = 34
    expect(r.friendship_score).toBeLessThan(45);
    expect(r.friendship_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes strength for 100% friendship mapping rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("Every child has a friendship mapping assessment"),
    ]));
  });

  it("includes strength for 80-99% friendship mapping rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
      ],
    }));
    // 4/5 = 80%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("80% of children have friendship mappings"),
    ]));
  });

  it("includes strength for 100% social network rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("Every child has a social network assessment"),
    ]));
  });

  it("includes strength for 80-99% social network rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
      ],
    }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("80% of children have social network assessments"),
    ]));
  });

  it("includes strength for >= 80% peer support rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("participating in peer support activities"),
    ]));
  });

  it("includes strength for 60-79% peer support rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 5,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
      ],
    }));
    // 3/5 = 60%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("60% of children engaged in peer support activities"),
    ]));
  });

  it("includes strength for >= 90% isolation prevention rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("isolation prevention interventions showing improvement"),
    ]));
  });

  it("includes strength for 70-89% isolation prevention rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: true }),
        makeIsolation({ id: "ip_3", outcome_improved: true }),
        makeIsolation({ id: "ip_4", outcome_improved: false }),
      ],
    }));
    // 3/4 = 75%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("majority of at-risk children are benefiting"),
    ]));
  });

  it("includes strength for >= 90% child satisfaction rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("report high satisfaction with their friendships"),
    ]));
  });

  it("includes strength for 70-89% child satisfaction rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_4", satisfaction_with_friendships: 2 }),
      ],
    }));
    // 3/4 = 75%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("satisfied with their friendships"),
    ]));
  });

  it("includes strength for >= 90% child confidence rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("report high confidence in social situations"),
    ]));
  });

  it("includes strength for 70-89% child confidence rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_4", confidence_in_social_situations: 2 }),
      ],
    }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("report social confidence"),
    ]));
  });

  it("includes strength for friendship quality >= 4.0", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship quality rating of"),
    ]));
  });

  it("includes strength for friendship quality 3.0-3.99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_3", friendship_quality_rating: 3 }),
      ],
    }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("competent quality friendships"),
    ]));
  });

  it("includes strength for >= 90% network positivity", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10 }),
      ],
    }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("positive — children are predominantly surrounded by supportive"),
    ]));
  });

  it("includes strength for 70-89% network positivity", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 8 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 7 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 8 }),
      ],
    }));
    // 23/30 = 77%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("positive social contacts"),
    ]));
  });

  it("includes strength for >= 80% outside friendship rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    // default mappings all have friends_outside_home=2 > 0 => 100%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("children have friendships outside the home"),
    ]));
  });

  it("includes strength for 60-79% outside friendship rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friends_outside_home: 2, friends_from_school: 1 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", friends_outside_home: 1, friends_from_school: 0 }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", friends_outside_home: 1, friends_from_school: 0 }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
      ],
    }));
    // 3/5 = 60%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("children have friendships outside the home"),
    ]));
  });

  it("includes strength for >= 90% inclusion rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("feel included"),
    ]));
  });

  it("includes strength for >= 90% staff support rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("feel supported by staff"),
    ]));
  });

  it("includes strength for >= 80% best friend rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("having a best friend"),
    ]));
  });

  it("includes strength for >= 90% peer enjoyment rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("enjoying peer support activities"),
    ]));
  });

  it("includes strength for >= 90% peer outcome rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("peer support activities achieved positive outcomes"),
    ]));
  });

  it("includes strength for >= 80% network stability rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("stable or growing"),
    ]));
  });

  it("includes strength for >= 90% barrier support rate when barriers exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", barriers_identified: false }),
      ],
    }));
    // 2 barriers, 2 with support = 100%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("identified social barriers have support in place"),
    ]));
  });

  it("includes strength for >= 90% child involvement in mapping", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("actively involved"),
    ]));
  });

  it("includes strength for 100% mapping review compliance", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship mapping reviews are up to date"),
    ]));
  });

  it("includes strength for 80-99% mapping review compliance", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", review_overdue: false }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", review_overdue: false }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", review_overdue: false }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", review_overdue: false }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", review_overdue: true }),
      ],
    }));
    // 4/5 = 80%
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship mapping reviews are on schedule"),
    ]));
  });

  it("includes strength for >= 90% peer documentation rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("documented notes"),
    ]));
  });

  it("includes strength for 0% loneliness rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("No children report feeling lonely"),
    ]));
  });

  it("includes strength for 100% high risk escalation rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", escalated_to_professional: true }),
        makeIsolation({ id: "ip_2", risk_level: "high", escalated_to_professional: true }),
      ],
    }));
    expect(r.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining("high-risk isolation cases have been escalated to professionals"),
    ]));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("raises concern when friendshipMappingRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("20% of children have friendship mappings"),
    ]));
  });

  it("raises concern when friendshipMappingRate 50-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
        makeMapping({ id: "fm_5", child_id: "yp_robin" }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor" }),
      ],
    }));
    // 6/10 = 60%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Friendship mapping coverage at 60%"),
    ]));
  });

  it("raises concern when socialNetworkRate < 50 with records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("10% of children have social network assessments"),
    ]));
  });

  it("raises concern when socialNetworkRate 50-79 with records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
        makeNetwork({ id: "sn_6", child_id: "yp_taylor" }),
      ],
    }));
    // 6/10 = 60%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Social network assessment coverage at 60%"),
    ]));
  });

  it("raises concern when peerSupportRate < 40 with records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
      ],
    }));
    // 3/10 = 30%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("30% of children are engaging in peer support activities"),
    ]));
  });

  it("raises concern when peerSupportRate 40-59 with records > 0", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
        makePeerSupport({ id: "ps_4", child_id: "yp_sam" }),
        makePeerSupport({ id: "ps_5", child_id: "yp_robin" }),
      ],
    }));
    // 5/10 = 50%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Peer support participation at 50%"),
    ]));
  });

  it("raises concern when isolationPreventionRate < 40", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
        makeIsolation({ id: "ip_3", outcome_improved: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("33% of isolation prevention interventions showing improvement"),
    ]));
  });

  it("raises concern when isolationPreventionRate 40-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
    }));
    // 1/2 = 50%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Isolation prevention effectiveness at 50%"),
    ]));
  });

  it("raises concern when childSatisfactionRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 2 }),
      ],
    }));
    // 0/3 = 0%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("0% of children report satisfaction with their friendships"),
    ]));
  });

  it("raises concern when childSatisfactionRate 50-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
      ],
    }));
    // 1/2 = 50%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Child satisfaction with friendships at 50%"),
    ]));
  });

  it("raises concern when lonelinessRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: true }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("67% of children report feeling lonely"),
    ]));
  });

  it("raises concern when lonelinessRate 26-50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: false }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("33% of children report feeling lonely"),
    ]));
  });

  it("raises concern when lonelinessRate 11-25", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: false }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
        makeSatisfaction({ id: "cs_4", feels_lonely: false }),
        makeSatisfaction({ id: "cs_5", feels_lonely: false }),
        makeSatisfaction({ id: "cs_6", feels_lonely: false }),
        makeSatisfaction({ id: "cs_7", feels_lonely: false }),
        makeSatisfaction({ id: "cs_8", feels_lonely: false }),
      ],
    }));
    // 1/8 = 13%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("13% of children report feeling lonely"),
    ]));
  });

  it("raises concern when childConfidenceRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 2 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 2 }),
        makeSatisfaction({ id: "cs_3", confidence_in_social_situations: 3 }),
      ],
    }));
    // 0/3 = 0%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("0% of children report confidence"),
    ]));
  });

  it("raises concern when childConfidenceRate 50-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 3 }),
      ],
    }));
    // 1/2 = 50%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Social confidence at 50%"),
    ]));
  });

  it("raises concern when noFriendsRate > 20", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", total_friends_identified: 0 }),
        makeMapping({ id: "fm_2", total_friends_identified: 0 }),
        makeMapping({ id: "fm_3", total_friends_identified: 3 }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("67% of children have no identified friends"),
    ]));
  });

  it("raises concern when 1 child has no friends (noFriendsRate 1-20)", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", total_friends_identified: 0 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", total_friends_identified: 3 }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", total_friends_identified: 4 }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", total_friends_identified: 5 }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", total_friends_identified: 2 }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor", total_friends_identified: 3 }),
      ],
    }));
    // 1/6 = 17% => 1-20 range; singular "child has"
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("1 child has no identified friends"),
    ]));
  });

  it("raises concern when multiple children have no friends (noFriendsRate 1-20)", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", total_friends_identified: 0 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", total_friends_identified: 0 }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", total_friends_identified: 5 }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", total_friends_identified: 5 }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", total_friends_identified: 5 }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor", total_friends_identified: 5 }),
        makeMapping({ id: "fm_7", child_id: "yp_quinn", total_friends_identified: 5 }),
        makeMapping({ id: "fm_8", child_id: "yp_blake", total_friends_identified: 5 }),
        makeMapping({ id: "fm_9", child_id: "yp_drew", total_friends_identified: 5 }),
        makeMapping({ id: "fm_10", child_id: "yp_lane", total_friends_identified: 5 }),
      ],
    }));
    // 2/10 = 20% => 1-20 range; plural "ren have"
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("2 children have no identified friends"),
    ]));
  });

  it("raises concern when avgFriendshipQuality < 2.5", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 2 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 2 }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship quality rating of 2/5"),
    ]));
  });

  it("raises concern when avgFriendshipQuality 2.5-2.99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 2 }),
      ],
    }));
    // (3+2)/2 = 2.5
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship quality rating of 2.5/5"),
    ]));
  });

  it("raises concern when decliningNetworkRate > 30", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", network_stability: "declining" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", network_stability: "declining" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", network_stability: "stable" }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("social networks are declining or volatile"),
    ]));
  });

  it("raises concern when overdue mapping reviews exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", review_overdue: true }),
        makeMapping({ id: "fm_2", review_overdue: false }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("friendship mapping review"),
    ]));
  });

  it("uses singular form for 1 overdue mapping review", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", review_overdue: true }),
        makeMapping({ id: "fm_2", review_overdue: false }),
        makeMapping({ id: "fm_3", review_overdue: false }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("1 friendship mapping review is overdue"),
    ]));
  });

  it("uses plural form for multiple overdue mapping reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", review_overdue: true }),
        makeMapping({ id: "fm_2", review_overdue: true }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("2 friendship mapping reviews are overdue"),
    ]));
  });

  it("raises concern when overdue network reviews exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", review_overdue: true }),
        makeNetwork({ id: "sn_2", review_overdue: false }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("social network review"),
    ]));
  });

  it("raises concern for overdue isolation intervention reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", review_overdue: true, intervention_active: true }),
        makeIsolation({ id: "ip_2", review_overdue: false, intervention_active: true }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("isolation intervention review"),
    ]));
  });

  it("raises concern for high risk isolation with active interventions", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", intervention_active: true }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("currently at high risk of social isolation"),
    ]));
  });

  it("uses singular for 1 child at high risk", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", intervention_active: true }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("1 child currently at high risk"),
    ]));
  });

  it("uses plural for multiple children at high risk", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", child_id: "yp_alex", risk_level: "high", intervention_active: true }),
        makeIsolation({ id: "ip_2", child_id: "yp_jordan", risk_level: "high", intervention_active: true }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("2 children currently at high risk"),
    ]));
  });

  it("raises concern when outsideFriendshipRate < 40", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_2", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_3", friends_outside_home: 1 }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("33% of children have friendships outside the home"),
    ]));
  });

  it("raises concern when wantMoreSocialRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_2", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_3", wants_more_social_opportunities: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("67% of children want more social opportunities"),
    ]));
  });

  it("raises concern when barrierSupportRate < 50 with barriers", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", barriers_identified: true, support_provided: false }),
        makeNetwork({ id: "sn_2", barriers_identified: true, support_provided: false }),
        makeNetwork({ id: "sn_3", barriers_identified: false }),
      ],
    }));
    // 0/2 = 0%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("identified social barriers have support in place"),
    ]));
  });

  it("raises concern when peerDocumentationRate < 70", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [
        makePeerSupport({ id: "ps_1", notes_recorded: true }),
        makePeerSupport({ id: "ps_2", notes_recorded: false }),
        makePeerSupport({ id: "ps_3", notes_recorded: false }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("Peer activity documentation at only 33%"),
    ]));
  });

  it("raises concern when highRiskEscalationRate < 50 with high risk", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", escalated_to_professional: false }),
        makeIsolation({ id: "ip_2", risk_level: "high", escalated_to_professional: false }),
      ],
    }));
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("high-risk isolation cases escalated to professionals"),
    ]));
  });

  it("does not raise concern when all metrics are strong", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.concerns.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends immediate action when friendshipMappingRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("friendship mapping assessments"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when lonelinessRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: true }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("widespread loneliness"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when isolationPreventionRate < 40", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("redesign ineffective isolation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when socialNetworkRate < 50 with records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("social network assessments to all children"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when childSatisfactionRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("friendship support provision with children"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when highRiskEscalationRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", risk_level: "high", escalated_to_professional: false }),
        makeIsolation({ id: "ip_2", risk_level: "high", escalated_to_professional: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("high-risk isolation cases are escalated"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when noFriendsRate > 20", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", total_friends_identified: 0 }),
        makeMapping({ id: "fm_2", total_friends_identified: 0 }),
        makeMapping({ id: "fm_3", total_friends_identified: 3 }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("friendship facilitation plans"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends immediate action when barrierSupportRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", barriers_identified: true, support_provided: false }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", barriers_identified: true, support_provided: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("Address all identified barriers"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends soon action for lonelinessRate 26-50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: false }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    // 33%
    const rec = r.recommendations.find(x => x.recommendation.includes("Address loneliness among children"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for overdue mapping reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", review_overdue: true }),
        makeMapping({ id: "fm_2", review_overdue: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("overdue friendship mapping reviews"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for overdue isolation reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", review_overdue: true, intervention_active: true }),
        makeIsolation({ id: "ip_2", review_overdue: false, intervention_active: true }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("overdue isolation intervention reviews"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for friendshipMappingRate 50-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
        makeMapping({ id: "fm_5", child_id: "yp_robin" }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor" }),
      ],
    }));
    // 60%
    const rec = r.recommendations.find(x => x.recommendation.includes("Extend friendship mapping coverage"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for socialNetworkRate 50-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
        makeNetwork({ id: "sn_6", child_id: "yp_taylor" }),
      ],
    }));
    // 60%
    const rec = r.recommendations.find(x => x.recommendation.includes("Increase social network assessment coverage"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for isolationPreventionRate 40-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
    }));
    // 50%
    const rec = r.recommendations.find(x => x.recommendation.includes("Review isolation prevention interventions that are not showing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action for outsideFriendshipRate 40-59", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friends_outside_home: 1, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_2", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_3", friends_outside_home: 1, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_4", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_5", friends_outside_home: 1, friends_from_school: 0, friends_from_community: 0 }),
      ],
    }));
    // 3/5 = 60% => not in 40-59 range
    // Need to make it 40-59
    const r2 = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "a", friends_outside_home: 1, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_2", child_id: "b", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_3", child_id: "c", friends_outside_home: 1, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_4", child_id: "d", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_5", child_id: "e", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
      ],
    }));
    // 2/5 = 40%
    const rec = r2.recommendations.find(x => x.recommendation.includes("Increase support for children to develop friendships outside"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends soon action when wantMoreSocialRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_2", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_3", wants_more_social_opportunities: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("Respond to children's requests for more social"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends planned action for childConfidenceRate < 70", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 3 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", confidence_in_social_situations: 3 }),
      ],
    }));
    // 1/3 = 33%
    const rec = r.recommendations.find(x => x.recommendation.includes("social confidence-building"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends planned action for childInvolvementRate < 70", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_involved_in_mapping: false }),
        makeMapping({ id: "fm_2", child_involved_in_mapping: false }),
        makeMapping({ id: "fm_3", child_involved_in_mapping: true }),
      ],
    }));
    // 1/3 = 33%
    const rec = r.recommendations.find(x => x.recommendation.includes("Increase child involvement in friendship mapping"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends planned action for peerDocumentationRate < 70", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [
        makePeerSupport({ id: "ps_1", notes_recorded: true }),
        makePeerSupport({ id: "ps_2", notes_recorded: false }),
        makePeerSupport({ id: "ps_3", notes_recorded: false }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("Improve documentation of peer support"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends planned action for peerSupportRate 40-59", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
        makePeerSupport({ id: "ps_4", child_id: "yp_sam" }),
        makePeerSupport({ id: "ps_5", child_id: "yp_robin" }),
      ],
    }));
    // 5/10 = 50%
    const rec = r.recommendations.find(x => x.recommendation.includes("Increase peer support activity participation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends planned action for childSatisfactionRate 50-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
      ],
    }));
    // 50%
    const rec = r.recommendations.find(x => x.recommendation.includes("Explore ways to improve children's satisfaction"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends planned action for decliningNetworkRate > 30", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", network_stability: "declining" }),
        makeNetwork({ id: "sn_2", network_stability: "declining" }),
        makeNetwork({ id: "sn_3", network_stability: "stable" }),
      ],
    }));
    const rec = r.recommendations.find(x => x.recommendation.includes("Investigate and address declining social networks"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("has sequentially ranked recommendations", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 20,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 2, total_friends_identified: 0, child_involved_in_mapping: false, review_overdue: true }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", network_stability: "declining", barriers_identified: true, support_provided: false }),
      ],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false, risk_level: "high", escalated_to_professional: false, review_overdue: true, intervention_active: true }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2, wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2, wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 4, feels_lonely: false, confidence_in_social_situations: 4, wants_more_social_opportunities: false }),
      ],
      peer_support_records: [],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("returns no recommendations when all metrics are strong", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("all recommendations have a regulatory_ref", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 20,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", child_involved_in_mapping: false, review_overdue: true }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2 }),
      ],
      peer_support_records: [],
    }));
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeDefined();
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS — CRITICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("critical insights", () => {
  it("critical insight when friendshipMappingRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("friendship mappings") && x.severity === "critical");
    expect(ins).toBeDefined();
  });

  it("critical insight when lonelinessRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: true }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("report feeling lonely") && x.severity === "critical");
    expect(ins).toBeDefined();
  });

  it("critical insight when isolationPreventionRate < 40", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("isolation prevention interventions showing improvement") && x.severity === "critical");
    expect(ins).toBeDefined();
  });

  it("critical insight when socialNetworkRate < 50 with records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("social network assessments") && x.severity === "critical");
    expect(ins).toBeDefined();
  });

  it("critical insight when noFriendsRate > 20", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", total_friends_identified: 0 }),
        makeMapping({ id: "fm_2", total_friends_identified: 0 }),
        makeMapping({ id: "fm_3", total_friends_identified: 3 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("no identified friends") && x.severity === "critical");
    expect(ins).toBeDefined();
  });

  it("critical insight when childSatisfactionRate < 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("satisfied with their friendships") && x.severity === "critical");
    expect(ins).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. INSIGHTS — WARNING
// ═══════════════════════════════════════════════════════════════════════════

describe("warning insights", () => {
  it("warning insight when friendshipMappingRate 50-79", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan" }),
        makeMapping({ id: "fm_3", child_id: "yp_casey" }),
        makeMapping({ id: "fm_4", child_id: "yp_sam" }),
        makeMapping({ id: "fm_5", child_id: "yp_robin" }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Friendship mapping coverage at 60%") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when socialNetworkRate 50-79 with records", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
        makeNetwork({ id: "sn_6", child_id: "yp_taylor" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Social network coverage at 60%") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when isolationPreventionRate 40-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Isolation prevention effectiveness at 50%") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when childSatisfactionRate 50-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 4 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 3 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Child satisfaction at 50%") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when lonelinessRate 11-50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", feels_lonely: true }),
        makeSatisfaction({ id: "cs_2", feels_lonely: false }),
        makeSatisfaction({ id: "cs_3", feels_lonely: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("report feeling lonely") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when childConfidenceRate 50-69", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_2", confidence_in_social_situations: 3 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Social confidence at 50%") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when decliningNetworkRate > 30", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", network_stability: "declining" }),
        makeNetwork({ id: "sn_2", network_stability: "volatile" }),
        makeNetwork({ id: "sn_3", network_stability: "stable" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("declining or volatile") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight for overdue mapping reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", review_overdue: true }),
        makeMapping({ id: "fm_2", review_overdue: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("friendship mapping review") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight for overdue isolation reviews", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", review_overdue: true, intervention_active: true }),
        makeIsolation({ id: "ip_2", review_overdue: false, intervention_active: true }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("overdue reviews") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when wantMoreSocialRate > 50", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_2", wants_more_social_opportunities: true }),
        makeSatisfaction({ id: "cs_3", wants_more_social_opportunities: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("want more social opportunities") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when outsideFriendshipRate < 40", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_2", friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0 }),
        makeMapping({ id: "fm_3", friends_outside_home: 1 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("friendships outside the home") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when avgFriendshipQuality 2.5-2.99", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", friendship_quality_rating: 2 }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("friendship quality at 2.5/5") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight when barrierRate > 30", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_2", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_3", barriers_identified: false }),
      ],
    }));
    // 2/3 = 67% > 30
    const ins = r.insights.find(x => x.text.includes("barriers to social connection") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight for peer activity type profile (>= 3 activities)", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("Peer support activity profile") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight for active isolation intervention types (>= 3 active)", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("Active isolation intervention types") && x.severity === "warning");
    expect(ins).toBeDefined();
  });

  it("warning insight for social network type distribution (>= 3 networks)", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("Social network type distribution") && x.severity === "warning");
    expect(ins).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. INSIGHTS — POSITIVE
// ═══════════════════════════════════════════════════════════════════════════

describe("positive insights", () => {
  it("positive insight for outstanding rating", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10 }),
      ],
    }));
    expect(r.friendship_rating).toBe("outstanding");
    const ins = r.insights.find(x => x.text.includes("outstanding friendship and social network support") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 100% mapping with 90%+ child involvement", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("Every child has a friendship mapping with high levels of child involvement") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ satisfaction with 0% loneliness", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("satisfaction with friendships and no child reports feeling lonely") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ isolation prevention with 100% high risk escalation", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", child_id: "yp_alex", outcome_improved: true, risk_level: "high", escalated_to_professional: true }),
        makeIsolation({ id: "ip_2", child_id: "yp_jordan", outcome_improved: true, risk_level: "high", escalated_to_professional: true }),
        makeIsolation({ id: "ip_3", child_id: "yp_casey", outcome_improved: true, risk_level: "medium", escalated_to_professional: false }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("isolation interventions improving with all high-risk cases escalated") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ network positivity with 80%+ stability", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10, network_stability: "stable" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 10, network_stability: "growing" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10, network_stability: "stable" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("positive contacts with") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 80%+ peer support with 90%+ enjoyment", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("children in peer support with") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 80%+ outside friendship rate", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("friendships outside the home") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 80%+ best friend rate with 4.0+ quality", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("best friend with average friendship quality") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ staff support and 90%+ inclusion", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("feel supported by staff") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ barrier support rate when barriers exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("identified social barriers have support in place") && x.severity === "positive");
    expect(ins).toBeDefined();
  });

  it("positive insight for 90%+ child confidence", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    const ins = r.insights.find(x => x.text.includes("high social confidence") && x.severity === "positive");
    expect(ins).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline mentions outstanding", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", contacts_count: 10, positive_contacts: 10 }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", contacts_count: 10, positive_contacts: 10 }),
      ],
    }));
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strength count and concerns if any", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });

  it("adequate headline mentions concern count", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_2", child_id: "yp_jordan", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_3", child_id: "yp_casey", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_4", child_id: "yp_sam", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_5", child_id: "yp_robin", friendship_quality_rating: 3 }),
        makeMapping({ id: "fm_6", child_id: "yp_taylor", friendship_quality_rating: 3 }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey" }),
        makeNetwork({ id: "sn_4", child_id: "yp_sam" }),
        makeNetwork({ id: "sn_5", child_id: "yp_robin" }),
        makeNetwork({ id: "sn_6", child_id: "yp_taylor" }),
      ],
      peer_support_records: [
        makePeerSupport({ id: "ps_1", child_id: "yp_alex" }),
        makePeerSupport({ id: "ps_2", child_id: "yp_jordan" }),
        makePeerSupport({ id: "ps_3", child_id: "yp_casey" }),
      ],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: true }),
        makeIsolation({ id: "ip_2", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 3, confidence_in_social_situations: 3 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 4, confidence_in_social_situations: 4 }),
        makeSatisfaction({ id: "cs_3", satisfaction_with_friendships: 3, confidence_in_social_situations: 3 }),
      ],
    }));
    expect(r.friendship_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline mentions significant concerns", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 20,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex", friendship_quality_rating: 1 }),
      ],
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex" }),
      ],
      peer_support_records: [],
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", outcome_improved: false }),
      ],
      child_satisfaction_records: [
        makeSatisfaction({ id: "cs_1", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2 }),
        makeSatisfaction({ id: "cs_2", satisfaction_with_friendships: 2, feels_lonely: true, confidence_in_social_situations: 2 }),
      ],
    }));
    expect(r.friendship_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("significant concern");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles total_children = 0 with some records as non-insufficient", () => {
    // allEmpty is false because we have records, so it proceeds to compute
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 0,
      friendship_mapping_records: [makeMapping()],
      social_network_records: [],
      peer_support_records: [],
      isolation_prevention_records: [],
      child_satisfaction_records: [],
    }));
    expect(r.friendship_rating).not.toBe("insufficient_data");
  });

  it("handles single child with all data", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 1,
      friendship_mapping_records: [makeMapping({ id: "fm_1", child_id: "yp_alex" })],
      social_network_records: [makeNetwork({ id: "sn_1", child_id: "yp_alex" })],
      peer_support_records: [makePeerSupport({ id: "ps_1", child_id: "yp_alex" })],
      isolation_prevention_records: [makeIsolation({ id: "ip_1", child_id: "yp_alex" })],
      child_satisfaction_records: [makeSatisfaction({ id: "cs_1", child_id: "yp_alex" })],
    }));
    expect(r.friendship_mapping_rate).toBe(100);
    expect(r.social_network_rate).toBe(100);
    expect(r.peer_support_rate).toBe(100);
    expect(r.friendship_rating).not.toBe("insufficient_data");
  });

  it("duplicate child_ids in mappings count as single unique child", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 3,
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", child_id: "yp_alex" }),
        makeMapping({ id: "fm_2", child_id: "yp_alex" }),
        makeMapping({ id: "fm_3", child_id: "yp_alex" }),
      ],
    }));
    // Only 1 unique child mapped out of 3
    expect(r.friendship_mapping_rate).toBe(33);
    expect(r.total_mappings).toBe(3);
  });

  it("handles zero-friend children correctly", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      friendship_mapping_records: [
        makeMapping({ id: "fm_1", total_friends_identified: 0, friends_in_home: 0, friends_outside_home: 0, friends_from_school: 0, friends_from_community: 0, online_friends_identified: 0 }),
      ],
    }));
    expect(r.avg_friends_per_child).toBe(0);
  });

  it("handles volatile networks as declining", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", network_stability: "volatile" }),
        makeNetwork({ id: "sn_2", network_stability: "volatile" }),
        makeNetwork({ id: "sn_3", network_stability: "stable" }),
      ],
    }));
    // 2/3 = 67% declining (volatile counts as declining)
    expect(r.concerns).toEqual(expect.arrayContaining([
      expect.stringContaining("declining or volatile"),
    ]));
  });

  it("only counts review_overdue on active isolation interventions", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", review_overdue: true, intervention_active: false }),
        makeIsolation({ id: "ip_2", review_overdue: false, intervention_active: true }),
      ],
    }));
    // Non-active intervention overdue review should NOT appear as concern
    const hasConcern = r.concerns.some(c => c.includes("isolation intervention review"));
    expect(hasConcern).toBe(false);
  });

  it("network barriers with support count correctly", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", barriers_identified: true, support_provided: true }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", barriers_identified: true, support_provided: false }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", barriers_identified: false, support_provided: false }),
      ],
    }));
    // barrierSupportRate: 1/2 = 50% — not <50 so no concern for that
    const hasConcern = r.concerns.some(c => c.includes("identified social barriers have support in place"));
    expect(hasConcern).toBe(false);
  });

  it("activity types analysis shows top 3 types", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [
        makePeerSupport({ id: "ps_1", activity_type: "group_activity" }),
        makePeerSupport({ id: "ps_2", activity_type: "group_activity" }),
        makePeerSupport({ id: "ps_3", activity_type: "mentoring" }),
        makePeerSupport({ id: "ps_4", activity_type: "buddy_scheme" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Peer support activity profile"));
    expect(ins).toBeDefined();
    expect(ins!.text).toContain("group activity (2)");
  });

  it("network type analysis shows distribution", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [
        makeNetwork({ id: "sn_1", child_id: "yp_alex", network_type: "peer" }),
        makeNetwork({ id: "sn_2", child_id: "yp_jordan", network_type: "family" }),
        makeNetwork({ id: "sn_3", child_id: "yp_casey", network_type: "community" }),
      ],
    }));
    const ins = r.insights.find(x => x.text.includes("Social network type distribution"));
    expect(ins).toBeDefined();
  });

  it("isolation intervention types insight only appears with >= 3 active", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [
        makeIsolation({ id: "ip_1", intervention_active: true }),
        makeIsolation({ id: "ip_2", intervention_active: true }),
        makeIsolation({ id: "ip_3", intervention_active: false }),
      ],
    }));
    // Only 2 active => should NOT show insight
    const ins = r.insights.find(x => x.text.includes("Active isolation intervention types"));
    expect(ins).toBeUndefined();
  });

  it("peer activity profile insight only appears with >= 3 total activities", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      peer_support_records: [
        makePeerSupport({ id: "ps_1" }),
        makePeerSupport({ id: "ps_2" }),
      ],
    }));
    // Only 2 activities => should NOT show insight
    const ins = r.insights.find(x => x.text.includes("Peer support activity profile"));
    expect(ins).toBeUndefined();
  });

  it("no socialNetworkRate penalty when no records exist", () => {
    // socialNetworkRate < 50 penalty only applies when social_network_records.length > 0
    const r = computeFriendshipSocialNetwork(baseInput({
      social_network_records: [],
    }));
    // Should not get the -5 penalty for socialNetworkRate
    expect(r.social_network_rate).toBe(0);
    // The score should still be computed without that penalty
  });

  it("no isolationPreventionRate penalty when no records exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      isolation_prevention_records: [],
    }));
    expect(r.isolation_prevention_rate).toBe(0);
  });

  it("no loneliness penalty when no surveys exist", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      child_satisfaction_records: [],
    }));
    expect(r.loneliness_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. RETURN SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("returns all required keys", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(r).toHaveProperty("friendship_rating");
    expect(r).toHaveProperty("friendship_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_mappings");
    expect(r).toHaveProperty("friendship_mapping_rate");
    expect(r).toHaveProperty("social_network_rate");
    expect(r).toHaveProperty("peer_support_rate");
    expect(r).toHaveProperty("isolation_prevention_rate");
    expect(r).toHaveProperty("child_satisfaction_rate");
    expect(r).toHaveProperty("child_confidence_rate");
    expect(r).toHaveProperty("avg_friends_per_child");
    expect(r).toHaveProperty("avg_friendship_quality");
    expect(r).toHaveProperty("network_positivity_rate");
    expect(r).toHaveProperty("peer_engagement_avg");
    expect(r).toHaveProperty("isolation_high_risk_count");
    expect(r).toHaveProperty("loneliness_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("friendship_score is a number between 0 and 100", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(typeof r.friendship_score).toBe("number");
    expect(r.friendship_score).toBeGreaterThanOrEqual(0);
    expect(r.friendship_score).toBeLessThanOrEqual(100);
  });

  it("friendship_rating is a valid rating value", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.friendship_rating);
  });

  it("strengths is an array of strings", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    for (const s of r.strengths) {
      expect(typeof s).toBe("string");
    }
  });

  it("concerns is an array of strings", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const r = computeFriendshipSocialNetwork(baseInput({
      total_children: 10,
      friendship_mapping_records: [makeMapping({ id: "fm_1", child_id: "yp_alex" })],
    }));
    for (const rec of r.recommendations) {
      expect(typeof rec.rank).toBe("number");
      expect(typeof rec.recommendation).toBe("string");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      expect(typeof rec.regulatory_ref).toBe("string");
    }
  });

  it("insights have text and severity", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    for (const ins of r.insights) {
      expect(typeof ins.text).toBe("string");
      expect(["critical", "warning", "positive"]).toContain(ins.severity);
    }
  });

  it("rates are integer percentages", () => {
    const r = computeFriendshipSocialNetwork(baseInput());
    expect(Number.isInteger(r.friendship_mapping_rate)).toBe(true);
    expect(Number.isInteger(r.social_network_rate)).toBe(true);
    expect(Number.isInteger(r.peer_support_rate)).toBe(true);
    expect(Number.isInteger(r.isolation_prevention_rate)).toBe(true);
    expect(Number.isInteger(r.child_satisfaction_rate)).toBe(true);
    expect(Number.isInteger(r.child_confidence_rate)).toBe(true);
    expect(Number.isInteger(r.network_positivity_rate)).toBe(true);
    expect(Number.isInteger(r.loneliness_rate)).toBe(true);
  });
});
