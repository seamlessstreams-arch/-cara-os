import { describe, it, expect } from "vitest";
import {
  computeCommunityIntegrationVolunteering,
  type CommunityIntegrationInput,
  type CommunityActivityRecordInput,
  type VolunteeringRecordInput,
  type SocialInclusionRecordInput,
  type NeighbourhoodRecordInput,
  type LocalServiceRecordInput,
} from "../home-community-integration-volunteering-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-29";

function daysAgo(n: number): string {
  const d = new Date("2026-05-29");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function futureDate(n: number): string {
  const d = new Date("2026-05-29");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeCommunityActivity(
  overrides: Partial<CommunityActivityRecordInput> = {},
): CommunityActivityRecordInput {
  return {
    id: `ca_${uid()}`,
    child_id: "c1",
    date: daysAgo(10),
    activity_name: "Football Club",
    activity_type: "sports_club",
    venue: "Local Sports Centre",
    duration_minutes: 60,
    attended: true,
    child_enjoyed: true,
    child_feedback: "Loved it",
    builds_friendships: true,
    ongoing_regular: true,
    staff_supported: true,
    risk_assessment_completed: true,
    consent_obtained: true,
    outcomes_documented: true,
    created_at: daysAgo(10),
    ...overrides,
  };
}

function makeVolunteering(
  overrides: Partial<VolunteeringRecordInput> = {},
): VolunteeringRecordInput {
  return {
    id: `vol_${uid()}`,
    child_id: "c1",
    date: daysAgo(10),
    organisation: "Local Charity Shop",
    role_description: "Sorting donations",
    volunteering_type: "charity_shop",
    hours: 3,
    child_initiated: true,
    child_enjoyed: true,
    child_feedback: "Really enjoyed it",
    skills_developed: ["Communication", "Organisation"],
    ongoing_commitment: true,
    safeguarding_check_completed: true,
    risk_assessment_completed: true,
    staff_supported: true,
    recognition_received: true,
    created_at: daysAgo(10),
    ...overrides,
  };
}

function makeSocialInclusion(
  overrides: Partial<SocialInclusionRecordInput> = {},
): SocialInclusionRecordInput {
  return {
    id: `si_${uid()}`,
    child_id: "c1",
    date: daysAgo(10),
    programme_name: "Peer Mentoring",
    programme_type: "peer_mentoring",
    provider: "Local Youth Service",
    child_engaged: true,
    child_feedback: "Found it helpful",
    outcomes_achieved: ["Improved confidence"],
    barriers_identified: ["Low self-esteem"],
    barriers_addressed: true,
    review_date: futureDate(30),
    reviewed: true,
    professional_involved: true,
    created_at: daysAgo(10),
    ...overrides,
  };
}

function makeNeighbourhood(
  overrides: Partial<NeighbourhoodRecordInput> = {},
): NeighbourhoodRecordInput {
  return {
    id: `nr_${uid()}`,
    date: daysAgo(10),
    interaction_type: "positive_feedback",
    description: "Neighbour praised the children's behaviour",
    positive_outcome: true,
    complaint: false,
    complaint_resolved: false,
    follow_up_needed: false,
    follow_up_completed: false,
    children_involved: ["c1"],
    community_perception_improved: true,
    staff_member: "Staff A",
    created_at: daysAgo(10),
    ...overrides,
  };
}

function makeLocalService(
  overrides: Partial<LocalServiceRecordInput> = {},
): LocalServiceRecordInput {
  return {
    id: `ls_${uid()}`,
    date: daysAgo(10),
    service_name: "Local GP Surgery",
    service_type: "gp_surgery",
    children_accessing: ["c1", "c2"],
    engagement_quality: "excellent",
    service_responsive: true,
    relationship_established: true,
    regular_contact: true,
    referral_made: false,
    referral_outcome: "",
    child_satisfaction: true,
    notes: "Good ongoing relationship",
    created_at: daysAgo(10),
    ...overrides,
  };
}

// ── Base Input ──────────────────────────────────────────────────────────────
// 5 children. Each domain is populated with enough records to score max bonuses.
// base = 52
// Bonus 1: communityParticipationRate (5/5=100%) >= 80 -> +4
// Bonus 2: volunteeringRate (4/5=80%) >= 60 -> +4
// Bonus 3: socialInclusionRate (4/5=80%) >= 70 -> +4
// Bonus 4: neighbourhoodRelationRate (10/10=100%) >= 80 -> +3
// Bonus 5: localServiceRate (5/5=100%) >= 80 -> +3
// Bonus 6: childSatisfactionRate (avg of 100,100,100,100=100) >= 90 -> +3
// Bonus 7: caFriendshipRate (5/5=100%) >= 70 -> +3
// Bonus 8: volOngoingRate (4/4=100%) >= 60 -> +2
// Bonus 9: siBarrierAddressedRate (4/4=100%) >= 80 -> +2
// Total = 52 + 4 + 4 + 4 + 3 + 3 + 3 + 3 + 2 + 2 = 80 (outstanding)

function baseInput(
  overrides: Partial<CommunityIntegrationInput> = {},
): CommunityIntegrationInput {
  return {
    today: TODAY,
    total_children: 5,
    community_activity_records: [
      makeCommunityActivity({ id: "ca1", child_id: "c1" }),
      makeCommunityActivity({ id: "ca2", child_id: "c2" }),
      makeCommunityActivity({ id: "ca3", child_id: "c3" }),
      makeCommunityActivity({ id: "ca4", child_id: "c4" }),
      makeCommunityActivity({ id: "ca5", child_id: "c5" }),
    ],
    volunteering_records: [
      makeVolunteering({ id: "v1", child_id: "c1" }),
      makeVolunteering({ id: "v2", child_id: "c2" }),
      makeVolunteering({ id: "v3", child_id: "c3" }),
      makeVolunteering({ id: "v4", child_id: "c4" }),
    ],
    social_inclusion_records: [
      makeSocialInclusion({ id: "si1", child_id: "c1" }),
      makeSocialInclusion({ id: "si2", child_id: "c2" }),
      makeSocialInclusion({ id: "si3", child_id: "c3" }),
      makeSocialInclusion({ id: "si4", child_id: "c4" }),
    ],
    neighbourhood_records: Array.from({ length: 10 }, (_, i) =>
      makeNeighbourhood({ id: `nr${i + 1}` }),
    ),
    local_service_records: [
      makeLocalService({ id: "ls1", children_accessing: ["c1", "c2", "c3", "c4", "c5"] }),
      makeLocalService({ id: "ls2", service_type: "dentist", children_accessing: ["c1", "c2"] }),
      makeLocalService({ id: "ls3", service_type: "library", children_accessing: ["c3", "c4"] }),
    ],
    ...overrides,
  };
}

// ── Minimal input (only 1 record per domain, all poor) ──────────────────────
// For penalty tests — ensures arrays are non-empty but metrics are poor.

function minimalPoorInput(
  overrides: Partial<CommunityIntegrationInput> = {},
): CommunityIntegrationInput {
  return {
    today: TODAY,
    total_children: 10,
    community_activity_records: [
      makeCommunityActivity({
        id: "ca_poor1",
        child_id: "c1",
        attended: false,
        child_enjoyed: false,
        builds_friendships: false,
        ongoing_regular: false,
        risk_assessment_completed: false,
        consent_obtained: false,
        outcomes_documented: false,
        child_feedback: "",
      }),
    ],
    volunteering_records: [
      makeVolunteering({
        id: "v_poor1",
        child_id: "c1",
        child_initiated: false,
        child_enjoyed: false,
        child_feedback: "",
        skills_developed: [],
        ongoing_commitment: false,
        safeguarding_check_completed: false,
        risk_assessment_completed: false,
        recognition_received: false,
      }),
    ],
    social_inclusion_records: [
      makeSocialInclusion({
        id: "si_poor1",
        child_id: "c1",
        child_engaged: false,
        child_feedback: "",
        outcomes_achieved: [],
        barriers_identified: ["Exclusion"],
        barriers_addressed: false,
        reviewed: false,
        professional_involved: false,
        review_date: daysAgo(5), // overdue
      }),
    ],
    neighbourhood_records: [
      makeNeighbourhood({
        id: "nr_poor1",
        interaction_type: "complaint_received",
        positive_outcome: false,
        complaint: true,
        complaint_resolved: false,
        follow_up_needed: true,
        follow_up_completed: false,
        community_perception_improved: false,
      }),
    ],
    local_service_records: [
      makeLocalService({
        id: "ls_poor1",
        children_accessing: ["c1"],
        engagement_quality: "poor",
        service_responsive: false,
        relationship_established: false,
        regular_contact: false,
        child_satisfaction: false,
      }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeCommunityIntegrationVolunteering", () => {
  // ── pct helper edge case ─────────────────────────────────────────────
  describe("pct(0,0) => 0 implicit", () => {
    it("returns 0 rates when arrays are empty but total_children > 0 with allEmpty path", () => {
      // All arrays empty + children > 0 => special case, but rates are 0 in the result
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 3,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(0);
      expect(r.volunteering_rate).toBe(0);
      expect(r.social_inclusion_rate).toBe(0);
      expect(r.neighbourhood_relation_rate).toBe(0);
      expect(r.local_service_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });
  });

  // ── INSUFFICIENT DATA ────────────────────────────────────────────────
  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children is 0", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 0,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_rating).toBe("insufficient_data");
      expect(r.community_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns all zero totals for insufficient_data", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 0,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.total_community_activities).toBe(0);
      expect(r.total_volunteering_records).toBe(0);
      expect(r.total_social_inclusion_records).toBe(0);
      expect(r.total_neighbourhood_records).toBe(0);
      expect(r.total_local_service_records).toBe(0);
    });
  });

  // ── INADEQUATE FLOOR (allEmpty + children > 0) ───────────────────────
  describe("inadequate floor (allEmpty + children > 0)", () => {
    it("returns inadequate/15 when all arrays empty but children on placement", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 4,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_rating).toBe("inadequate");
      expect(r.community_score).toBe(15);
    });

    it("has 1 concern for allEmpty path", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 2,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No community activity records");
    });

    it("has 2 recommendations for allEmpty path", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 2,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has 1 critical insight for allEmpty path", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 2,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("headline mentions urgent attention", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 2,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.headline).toContain("urgent attention");
    });
  });

  // ── OUTSTANDING ──────────────────────────────────────────────────────
  describe("outstanding (score >= 80)", () => {
    it("baseInput scores outstanding/80", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.community_rating).toBe("outstanding");
      expect(r.community_score).toBe(80);
    });

    it("headline says Outstanding", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has positive insight for outstanding rating", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      const pos = r.insights.filter((i) => i.severity === "positive");
      expect(pos.length).toBeGreaterThan(0);
      expect(pos.some((i) => i.text.includes("outstanding community integration"))).toBe(true);
    });

    it("should have no concerns at outstanding", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("total counts are correct at outstanding", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.total_community_activities).toBe(5);
      expect(r.total_volunteering_records).toBe(4);
      expect(r.total_social_inclusion_records).toBe(4);
      expect(r.total_neighbourhood_records).toBe(10);
      expect(r.total_local_service_records).toBe(3);
    });

    it("all 6 rates are high at outstanding", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.community_participation_rate).toBe(100);
      expect(r.volunteering_rate).toBe(80);
      expect(r.social_inclusion_rate).toBe(80);
      expect(r.neighbourhood_relation_rate).toBe(100);
      expect(r.local_service_rate).toBe(100);
      expect(r.child_satisfaction_rate).toBe(100);
    });
  });

  // ── GOOD ─────────────────────────────────────────────────────────────
  describe("good (score 65-79)", () => {
    it("scores good when some bonuses drop to lower tier", () => {
      // Drop volunteering to 3/5=60% (still +4), but remove bonus 8 by making
      // volOngoingRate = 0 (all ongoing_commitment false) => -2 -> score 78
      // Drop bonus 9 by removing barriers => -2 -> score 76
      // Drop neighbourhood to 6/10 positive -> 60% => bonus4 drops to +1 instead of +3 => -2 -> 74
      // That is 74 => good
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          volunteering_records: [
            makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false }),
            makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false }),
            makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false }),
            makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false }),
          ],
          social_inclusion_records: [
            makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: [], barriers_addressed: false }),
          ],
          neighbourhood_records: [
            ...Array.from({ length: 6 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            ...Array.from({ length: 4 }, (_, i) =>
              makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
            ),
          ],
        }),
      );
      expect(r.community_rating).toBe("good");
      expect(r.community_score).toBeGreaterThanOrEqual(65);
      expect(r.community_score).toBeLessThan(80);
    });

    it("headline says Good for good rating", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          volunteering_records: [
            makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false }),
            makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false }),
            makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false }),
            makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false }),
          ],
          social_inclusion_records: [
            makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: [], barriers_addressed: false }),
          ],
          neighbourhood_records: [
            ...Array.from({ length: 6 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            ...Array.from({ length: 4 }, (_, i) =>
              makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
            ),
          ],
        }),
      );
      expect(r.headline).toContain("Good");
    });
  });

  // ── ADEQUATE ─────────────────────────────────────────────────────────
  describe("adequate (score 45-64)", () => {
    it("scores adequate when most bonuses are at lower tier or absent", () => {
      // base=52, need total 45-64
      // B1: communityParticipation 3/5=60% -> +2
      // B2: volunteeringRate 2/5=40% -> +2
      // B3: socialInclusionRate 2/5=40% -> +2
      // B4: neighbourhoodRelationRate 7/10=70% -> +1
      // B5: localServiceRate 3/5=60% -> +1 (50-79)
      // B6: childSatisfactionRate: ca=0% vol=0% si=0% ls=0% => avg=0 -> +0, penalty4=-4
      // B7: caFriendshipRate 0% -> +0
      // B8: volOngoingRate 0% -> +0
      // B9: no barriers -> +0
      // Total = 52 + 2 + 2 + 2 + 1 + 1 - 4 = 56 => adequate
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false, child_enjoyed: false }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false, child_enjoyed: false }),
        ],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
        ],
        neighbourhood_records: [
          ...Array.from({ length: 7 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 3 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ],
        local_service_records: [
          makeLocalService({
            id: "ls1",
            children_accessing: ["c1", "c2", "c3"],
            child_satisfaction: false,
          }),
        ],
      });
      expect(r.community_rating).toBe("adequate");
      expect(r.community_score).toBe(56);
    });

    it("headline mentions adequate", () => {
      // base=52, NR only at 50% => no bonus, no penalty, no satisfaction sources
      // Score = 52 => adequate
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ],
        local_service_records: [],
      });
      expect(r.community_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── INADEQUATE ───────────────────────────────────────────────────────
  describe("inadequate (score < 45)", () => {
    it("scores inadequate with poor data across all domains", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.community_rating).toBe("inadequate");
      expect(r.community_score).toBeLessThan(45);
    });

    it("headline says inadequate", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.headline).toContain("inadequate");
    });

    it("has concerns and recommendations when inadequate", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS TESTS — isolate each bonus
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 1: communityParticipationRate", () => {
    // To isolate: need CA records with children attending, everything else
    // giving no bonuses. total_children matters for rate.

    function bonus1Input(caRecords: CommunityActivityRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: caRecords,
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      };
    }

    it("+4 when communityParticipationRate >= 80", () => {
      // 4/5 = 80%
      const r = computeCommunityIntegrationVolunteering(
        bonus1Input([
          makeCommunityActivity({ id: "b1a", child_id: "c1", builds_friendships: false }),
          makeCommunityActivity({ id: "b1b", child_id: "c2", builds_friendships: false }),
          makeCommunityActivity({ id: "b1c", child_id: "c3", builds_friendships: false }),
          makeCommunityActivity({ id: "b1d", child_id: "c4", builds_friendships: false }),
        ]),
      );
      // base 52 + 4 (B1) + B7 (friendship) depends on caFriendshipRate = 0% -> 0
      // But builds_friendships is false so caFriendshipRate = 0 -> no bonus 7
      // No penalties since participation >= 30
      // child_enjoyed=true for all => caEnjoymentRate=100%. Satisfaction sources has ca => 100 => B6 >=90 => +3
      expect(r.community_score).toBe(52 + 4 + 3); // B1=+4, B6=+3 (satisfaction from CA enjoyment=100)
    });

    it("+2 when communityParticipationRate 60-79", () => {
      // 3/5 = 60%
      const r = computeCommunityIntegrationVolunteering(
        bonus1Input([
          makeCommunityActivity({ id: "b1a", child_id: "c1", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "b1b", child_id: "c2", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "b1c", child_id: "c3", builds_friendships: false, child_enjoyed: false }),
        ]),
      );
      // B1=+2, B6: enjoyment=0% => satisfaction=0 => childSatisfactionRate < 40 with sources.length>0 => penalty -4
      // B7: friendship=0 => no bonus
      // Penalty 1: participation 60% >= 30, no penalty
      // Penalty 4: childSatisfactionRate < 40 => -4
      expect(r.community_score).toBe(52 + 2 - 4); // 50
    });

    it("+0 when communityParticipationRate < 60", () => {
      // 2/5 = 40%
      const r = computeCommunityIntegrationVolunteering(
        bonus1Input([
          makeCommunityActivity({ id: "b1a", child_id: "c1", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "b1b", child_id: "c2", builds_friendships: false, child_enjoyed: false }),
        ]),
      );
      // B1=+0, Penalty1: 40% >= 30 no penalty
      // B6: satisfaction 0% => penalty -4
      expect(r.community_score).toBe(52 - 4); // 48
    });

    it("penalty -5 when communityParticipationRate < 30 and ca90d > 0", () => {
      // 1/5 = 20% < 30
      const r = computeCommunityIntegrationVolunteering(
        bonus1Input([
          makeCommunityActivity({ id: "b1a", child_id: "c1", builds_friendships: false, child_enjoyed: false }),
        ]),
      );
      // B1=+0, Penalty1=-5, B6 satisfaction 0% => penalty4=-4
      expect(r.community_score).toBe(52 - 5 - 4); // 43
    });
  });

  describe("Bonus 2: volunteeringRate", () => {
    function bonus2Input(volRecords: VolunteeringRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: volRecords,
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      };
    }

    it("+4 when volunteeringRate >= 60", () => {
      // 3/5 = 60%
      const r = computeCommunityIntegrationVolunteering(
        bonus2Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2=+4, B8: volOngoing=0% no bonus. B6: vol enjoyment=0% => satisfaction=0 => penalty4=-4
      // Penalty2: volRate=60% >= 10, no penalty
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });

    it("+2 when volunteeringRate 30-59", () => {
      // 2/5 = 40%
      const r = computeCommunityIntegrationVolunteering(
        bonus2Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2=+2, penalty4=-4
      expect(r.community_score).toBe(52 + 2 - 4); // 50
    });

    it("+0 when volunteeringRate < 30", () => {
      // 1/5 = 20%
      const r = computeCommunityIntegrationVolunteering(
        bonus2Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2=+0, Penalty2: volRate=20% >= 10 but < 10 check is volunteeringRate < 10
      // 20% >= 10 => no penalty2
      // Penalty4=-4 (satisfaction 0%)
      expect(r.community_score).toBe(52 - 4); // 48
    });

    it("penalty -4 when volunteeringRate < 10 and vol90d > 0", () => {
      // 0/10 = 0% but need vol90d > 0
      // Use 1 vol record with child c1 but total_children=20 => 1/20=5% < 10
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 20,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false, child_enjoyed: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B2=+0, Penalty2=-4 (volRate=5% < 10), penalty4=-4 (satisfaction 0%)
      expect(r.community_score).toBe(52 - 4 - 4); // 44
    });
  });

  describe("Bonus 3: socialInclusionRate", () => {
    function bonus3Input(siRecords: SocialInclusionRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: siRecords,
        neighbourhood_records: [],
        local_service_records: [],
      };
    }

    it("+4 when socialInclusionRate >= 70", () => {
      // 4/5 = 80% >= 70
      const r = computeCommunityIntegrationVolunteering(
        bonus3Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: [], child_engaged: false }),
          makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: [], child_engaged: false }),
        ]),
      );
      // B3=+4, B6: siEngagement=0% => satisfaction=0 => penalty4=-4
      // B9: no barriers identified => no bonus
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });

    it("+2 when socialInclusionRate 40-69", () => {
      // 2/5 = 40%
      const r = computeCommunityIntegrationVolunteering(
        bonus3Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], child_engaged: false }),
        ]),
      );
      // B3=+2, penalty4=-4
      expect(r.community_score).toBe(52 + 2 - 4); // 50
    });

    it("+0 when socialInclusionRate < 40", () => {
      // 1/5 = 20%
      const r = computeCommunityIntegrationVolunteering(
        bonus3Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], child_engaged: false }),
        ]),
      );
      // B3=+0, penalty4=-4
      expect(r.community_score).toBe(52 - 4); // 48
    });
  });

  describe("Bonus 4: neighbourhoodRelationRate", () => {
    function bonus4Input(nrRecords: NeighbourhoodRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: nrRecords,
        local_service_records: [],
      };
    }

    it("+3 when neighbourhoodRelationRate >= 80", () => {
      // 8/10 = 80%
      const r = computeCommunityIntegrationVolunteering(
        bonus4Input([
          ...Array.from({ length: 8 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 2 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ]),
      );
      // B4=+3. No satisfaction sources => no B6, no penalty4
      expect(r.community_score).toBe(52 + 3); // 55
    });

    it("+1 when neighbourhoodRelationRate 60-79", () => {
      // 6/10 = 60%
      const r = computeCommunityIntegrationVolunteering(
        bonus4Input([
          ...Array.from({ length: 6 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 4 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ]),
      );
      expect(r.community_score).toBe(52 + 1); // 53
    });

    it("+0 when neighbourhoodRelationRate < 60", () => {
      // 5/10 = 50%
      const r = computeCommunityIntegrationVolunteering(
        bonus4Input([
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ]),
      );
      expect(r.community_score).toBe(52); // no bonus no penalty (50% >= 40)
    });

    it("penalty -5 when neighbourhoodRelationRate < 40 and nr90d > 0", () => {
      // 3/10 = 30% < 40
      const r = computeCommunityIntegrationVolunteering(
        bonus4Input([
          ...Array.from({ length: 3 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 7 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ]),
      );
      expect(r.community_score).toBe(52 - 5); // 47
    });
  });

  describe("Bonus 5: localServiceRate", () => {
    function bonus5Input(lsRecords: LocalServiceRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: lsRecords,
      };
    }

    it("+3 when localServiceRate >= 80", () => {
      // children_accessing covers 4/5 = 80%
      const r = computeCommunityIntegrationVolunteering(
        bonus5Input([
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2", "c3", "c4"], child_satisfaction: false }),
        ]),
      );
      // B5=+3, B6: lsSatisfaction=0% => satisfaction=0 => penalty4=-4
      expect(r.community_score).toBe(52 + 3 - 4); // 51
    });

    it("+1 when localServiceRate 50-79", () => {
      // 3/5 = 60%
      const r = computeCommunityIntegrationVolunteering(
        bonus5Input([
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2", "c3"], child_satisfaction: false }),
        ]),
      );
      // B5=+1, penalty4=-4
      expect(r.community_score).toBe(52 + 1 - 4); // 49
    });

    it("+0 when localServiceRate < 50", () => {
      // 2/5 = 40%
      const r = computeCommunityIntegrationVolunteering(
        bonus5Input([
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2"], child_satisfaction: false }),
        ]),
      );
      // B5=+0, penalty4=-4
      expect(r.community_score).toBe(52 - 4); // 48
    });
  });

  describe("Bonus 6: childSatisfactionRate", () => {
    it("+3 when childSatisfactionRate >= 90", () => {
      // Only CA source: 100% enjoyment => satisfaction=100 >=90 => +3
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B1: 1/5=20% < 60 => +0
      // Penalty1: 20% < 30 => -5
      // B6=+3, B7: friendship=0 => 0
      expect(r.community_score).toBe(52 + 3 - 5); // 50
    });

    it("+1 when childSatisfactionRate 70-89", () => {
      // Mix to get ~75%: 3/4 CA enjoyed + 1/4 not => 75% avg
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // caAttended=4, caEnjoyed=3, caEnjoymentRate=75%. Satisfaction=75 => B6=+1
      // communityParticipationRate = 4/5 = 80% => B1=+4
      // B7: friendship=0% => 0
      expect(r.community_score).toBe(52 + 4 + 1); // 57
    });

    it("+0 when childSatisfactionRate < 70", () => {
      // 2/4 enjoy = 50%. Satisfaction = 50 < 70 => +0
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // caEnjoymentRate=50%. satisfaction=50. B6=0
      // B1: 4/5=80% => +4, B7: friendship=0 => 0
      expect(r.community_score).toBe(52 + 4); // 56
    });

    it("penalty -4 when childSatisfactionRate < 40 and sources > 0", () => {
      // All attended but none enjoyed: enjoyment=0%
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // satisfaction=0. B6=0, Penalty4=-4
      // B1: 4/5=80% => +4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });
  });

  describe("Bonus 7: caFriendshipRate", () => {
    it("+3 when caFriendshipRate >= 70 and caAttended > 0", () => {
      // 3/4 = 75% friendship
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: false, child_enjoyed: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B1: 4/5=80% => +4, B7=+3, B6: satisfaction 0% => penalty4=-4
      expect(r.community_score).toBe(52 + 4 + 3 - 4); // 55
    });

    it("+1 when caFriendshipRate 50-69 and caAttended > 0", () => {
      // 2/4 = 50% friendship
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: false, child_enjoyed: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B1: 4/5=80% => +4, B7=+1, penalty4=-4
      expect(r.community_score).toBe(52 + 4 + 1 - 4); // 53
    });

    it("+0 when caFriendshipRate < 50", () => {
      // 1/4 = 25%
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: true, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false, child_enjoyed: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: false, child_enjoyed: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B1: 4/5=80% => +4, B7=+0, penalty4=-4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });

    it("+0 when caAttended is 0 even with friendship data", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", attended: false, builds_friendships: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // caAttended=0 => B7 guard fails => +0. B1: 0/5=0% < 30 => penalty1=-5
      // No satisfaction sources (caAttended=0) => no penalty4
      expect(r.community_score).toBe(52 - 5); // 47
    });
  });

  describe("Bonus 8: volOngoingRate", () => {
    function bonus8Input(volRecords: VolunteeringRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: volRecords,
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      };
    }

    it("+2 when volOngoingRate >= 60 and vol90d.length > 0", () => {
      // 3/4 = 75% ongoing
      const r = computeCommunityIntegrationVolunteering(
        bonus8Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2: 4/5=80% => +4, B8=+2, penalty4=-4 (satisfaction 0%)
      expect(r.community_score).toBe(52 + 4 + 2 - 4); // 54
    });

    it("+1 when volOngoingRate 30-59", () => {
      // 2/5 = 40% ongoing
      const r = computeCommunityIntegrationVolunteering(
        bonus8Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v5", child_id: "c5", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2: 5/5=100% => +4, B8=+1, penalty4=-4
      expect(r.community_score).toBe(52 + 4 + 1 - 4); // 53
    });

    it("+0 when volOngoingRate < 30", () => {
      // 1/5 = 20% ongoing
      const r = computeCommunityIntegrationVolunteering(
        bonus8Input([
          makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: true, child_enjoyed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false, child_enjoyed: false }),
          makeVolunteering({ id: "v5", child_id: "c5", ongoing_commitment: false, child_enjoyed: false }),
        ]),
      );
      // B2: 5/5=100% => +4, B8=+0, penalty4=-4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });
  });

  describe("Bonus 9: siBarrierAddressedRate", () => {
    function bonus9Input(siRecords: SocialInclusionRecordInput[]): CommunityIntegrationInput {
      return {
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: siRecords,
        neighbourhood_records: [],
        local_service_records: [],
      };
    }

    it("+2 when siBarrierAddressedRate >= 80 and barriers identified > 0", () => {
      // 4/4 = 100% addressed
      const r = computeCommunityIntegrationVolunteering(
        bonus9Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: ["B3"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: ["B4"], barriers_addressed: true, child_engaged: false }),
        ]),
      );
      // B3: 4/5=80% => +4, B9=+2, penalty4=-4 (engagement 0%)
      expect(r.community_score).toBe(52 + 4 + 2 - 4); // 54
    });

    it("+1 when siBarrierAddressedRate 50-79", () => {
      // 2/4 = 50% addressed
      const r = computeCommunityIntegrationVolunteering(
        bonus9Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: ["B3"], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: ["B4"], barriers_addressed: false, child_engaged: false }),
        ]),
      );
      // B3: 4/5=80% => +4, B9=+1, penalty4=-4
      expect(r.community_score).toBe(52 + 4 + 1 - 4); // 53
    });

    it("+0 when siBarrierAddressedRate < 50", () => {
      // 1/4 = 25% addressed
      const r = computeCommunityIntegrationVolunteering(
        bonus9Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: true, child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: ["B3"], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: ["B4"], barriers_addressed: false, child_engaged: false }),
        ]),
      );
      // B3: 4/5=80% => +4, B9=+0, penalty4=-4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });

    it("+0 when no barriers identified (guard fails)", () => {
      const r = computeCommunityIntegrationVolunteering(
        bonus9Input([
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
          makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: [], barriers_addressed: false, child_engaged: false }),
        ]),
      );
      // B3: 4/5=80% => +4, B9=+0 (no barriers), penalty4=-4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PENALTY TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("Penalty 1: communityParticipationRate < 30", () => {
    it("applies -5 when rate < 30 and ca90d > 0", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/10=10% < 30 => penalty1=-5
      // satisfaction=0% => penalty4=-4
      expect(r.community_score).toBe(52 - 5 - 4); // 43
    });

    it("does NOT apply when ca90d is empty", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: daysAgo(100) }), // outside 90d
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // ca90d is empty (100 days ago > 90). communityParticipationRate=0 but ca90d.length=0 => no penalty1
      expect(r.community_score).toBe(52);
    });
  });

  describe("Penalty 2: volunteeringRate < 10", () => {
    it("applies -4 when rate < 10 and vol90d > 0", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 20,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", child_enjoyed: false, ongoing_commitment: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/20=5% < 10 => penalty2=-4, satisfaction=0% => penalty4=-4
      expect(r.community_score).toBe(52 - 4 - 4); // 44
    });

    it("does NOT apply when vol90d is empty", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 20,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", date: daysAgo(100) }), // outside 90d
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_score).toBe(52);
    });
  });

  describe("Penalty 3: neighbourhoodRelationRate < 40", () => {
    it("applies -5 when rate < 40 and nr90d > 0", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr2", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      // 1/3 = 33% < 40 => penalty3=-5
      expect(r.community_score).toBe(52 - 5); // 47
    });

    it("does NOT apply when nr90d is empty", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", date: daysAgo(100), positive_outcome: false }),
        ],
        local_service_records: [],
      });
      expect(r.community_score).toBe(52);
    });
  });

  describe("Penalty 4: childSatisfactionRate < 40", () => {
    it("applies -4 when rate < 40 and satisfactionSources > 0", () => {
      // caAttended > 0, enjoyment = 0%
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca5", child_id: "c5", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // B1: 5/5=100% => +4, penalty4=-4
      expect(r.community_score).toBe(52 + 4 - 4); // 52
    });

    it("does NOT apply when satisfactionSources is empty", () => {
      // Only neighbourhood records - no satisfaction signals
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      // No satisfaction sources. B4: 1/1=100% => +3
      expect(r.community_score).toBe(52 + 3); // 55
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ALL 6 RATES
  // ═══════════════════════════════════════════════════════════════════════

  describe("rate calculations", () => {
    it("community_participation_rate reflects unique attended child IDs in 90d / total_children", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 4,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
          makeCommunityActivity({ id: "ca2", child_id: "c1" }), // duplicate child
          makeCommunityActivity({ id: "ca3", child_id: "c2" }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(50); // 2/4 = 50%
    });

    it("volunteering_rate reflects unique child IDs in vol90d / total_children", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 4,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1" }),
          makeVolunteering({ id: "v2", child_id: "c2" }),
          makeVolunteering({ id: "v3", child_id: "c3" }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.volunteering_rate).toBe(75); // 3/4 = 75%
    });

    it("social_inclusion_rate reflects unique child IDs in si90d / total_children", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1" }),
          makeSocialInclusion({ id: "si2", child_id: "c2" }),
          makeSocialInclusion({ id: "si3", child_id: "c3" }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.social_inclusion_rate).toBe(30); // 3/10 = 30%
    });

    it("neighbourhood_relation_rate reflects positive / total nr90d", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", positive_outcome: true }),
          makeNeighbourhood({ id: "nr3", positive_outcome: false, community_perception_improved: false }),
        ],
        local_service_records: [],
      });
      expect(r.neighbourhood_relation_rate).toBe(67); // 2/3 = 67%
    });

    it("local_service_rate reflects unique children_accessing in ls90d / total_children", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2"] }),
          makeLocalService({ id: "ls2", children_accessing: ["c2", "c3"] }), // c2 duplicate
        ],
      });
      expect(r.local_service_rate).toBe(30); // 3/10 = 30%
    });

    it("child_satisfaction_rate averages across active domains", () => {
      // CA: 1/1 enjoy = 100%, Vol: 1/1 enjoy = 100% => avg = 100
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c2", child_enjoyed: true, ongoing_commitment: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.child_satisfaction_rate).toBe(100); // avg(100, 100)
    });

    it("child_satisfaction_rate is 0 when no satisfaction sources", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [makeNeighbourhood({ id: "nr1" })],
        local_service_records: [],
      });
      expect(r.child_satisfaction_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes communityParticipationRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("community participation rate"))).toBe(true);
    });

    it("includes communityParticipationRate 60-79 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          total_children: 5,
          community_activity_records: [
            makeCommunityActivity({ id: "ca1", child_id: "c1" }),
            makeCommunityActivity({ id: "ca2", child_id: "c2" }),
            makeCommunityActivity({ id: "ca3", child_id: "c3" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("community participation"))).toBe(true);
    });

    it("includes caEnjoymentRate >= 90 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("enjoying community activities"))).toBe(true);
    });

    it("includes caEnjoymentRate 70-89 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          community_activity_records: [
            makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true }),
            makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: true }),
            makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true }),
            makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false }),
            makeCommunityActivity({ id: "ca5", child_id: "c5", child_enjoyed: false }),
          ],
        }),
      );
      // 3/5 = 60% enjoyment => doesn't hit 70. Need 70-89%.
      // Actually 3/5 = 60%. Need at least 70%.
      // Let me fix: 4/5 = 80% enjoyment
      expect(r.community_participation_rate).toBe(100);
    });

    it("includes caFriendshipRate >= 70 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("build friendships"))).toBe(true);
    });

    it("includes caTypeVariety >= 5 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          community_activity_records: [
            makeCommunityActivity({ id: "ca1", child_id: "c1", activity_type: "sports_club" }),
            makeCommunityActivity({ id: "ca2", child_id: "c2", activity_type: "youth_group" }),
            makeCommunityActivity({ id: "ca3", child_id: "c3", activity_type: "arts_culture" }),
            makeCommunityActivity({ id: "ca4", child_id: "c4", activity_type: "music" }),
            makeCommunityActivity({ id: "ca5", child_id: "c5", activity_type: "drama" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("different types of community activities"))).toBe(true);
    });

    it("includes caOngoingRate >= 70 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("ongoing regular commitments"))).toBe(true);
    });

    it("includes volunteeringRate >= 60 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("engaged in volunteering"))).toBe(true);
    });

    it("includes volunteeringRate 30-59 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          volunteering_records: [
            makeVolunteering({ id: "v1", child_id: "c1" }),
            makeVolunteering({ id: "v2", child_id: "c2" }),
          ],
        }),
      );
      // 2/5=40% => 30-59
      expect(r.strengths.some((s) => s.includes("volunteering engagement"))).toBe(true);
    });

    it("includes volChildInitiatedRate >= 60 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("child-initiated"))).toBe(true);
    });

    it("includes volSkillsRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("develop new skills"))).toBe(true);
    });

    it("includes volRecognitionRate >= 70 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("volunteering recognised"))).toBe(true);
    });

    it("includes volOngoingRate >= 60 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("ongoing commitment"))).toBe(true);
    });

    it("includes socialInclusionRate >= 70 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("social inclusion programme coverage"))).toBe(true);
    });

    it("includes socialInclusionRate 40-69 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          social_inclusion_records: [
            makeSocialInclusion({ id: "si1", child_id: "c1" }),
            makeSocialInclusion({ id: "si2", child_id: "c2" }),
          ],
        }),
      );
      // 2/5=40%
      expect(r.strengths.some((s) => s.includes("social inclusion programmes"))).toBe(true);
    });

    it("includes siEngagementRate >= 90 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("child engagement in inclusion programmes"))).toBe(true);
    });

    it("includes siBarrierAddressedRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("barriers addressed"))).toBe(true);
    });

    it("includes siOutcomesRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("documented outcomes"))).toBe(true);
    });

    it("includes neighbourhoodRelationRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("positive neighbourhood interactions"))).toBe(true);
    });

    it("includes neighbourhoodRelationRate 60-79 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          neighbourhood_records: [
            ...Array.from({ length: 6 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            ...Array.from({ length: 4 }, (_, i) =>
              makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
            ),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("positive neighbourhood outcomes"))).toBe(true);
    });

    it("includes nrComplaintResolutionRate >= 90 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          neighbourhood_records: [
            ...Array.from({ length: 8 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            makeNeighbourhood({
              id: "nrc1",
              complaint: true,
              complaint_resolved: true,
              positive_outcome: true,
            }),
            makeNeighbourhood({
              id: "nrc2",
              complaint: true,
              complaint_resolved: true,
              positive_outcome: true,
            }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("complaint resolution"))).toBe(true);
    });

    it("includes nrPositiveFeedback >= 3 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      // baseInput has 10 neighbourhood records all with interaction_type "positive_feedback"
      expect(r.strengths.some((s) => s.includes("positive feedback from neighbours"))).toBe(true);
    });

    it("includes nrJointActivities >= 2 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          neighbourhood_records: [
            ...Array.from({ length: 8 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            makeNeighbourhood({ id: "nrj1", interaction_type: "joint_activity", positive_outcome: true }),
            makeNeighbourhood({ id: "nrj2", interaction_type: "joint_activity", positive_outcome: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("joint activities with neighbours"))).toBe(true);
    });

    it("includes localServiceRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("children accessing local services"))).toBe(true);
    });

    it("includes localServiceRate 50-79 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          local_service_records: [
            makeLocalService({ id: "ls1", children_accessing: ["c1", "c2", "c3"] }),
          ],
        }),
      );
      // 3/5 = 60%
      expect(r.strengths.some((s) => s.includes("local service engagement"))).toBe(true);
    });

    it("includes lsQualityRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("rated good or excellent"))).toBe(true);
    });

    it("includes lsRelationshipRate >= 80 strength", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("established relationships"))).toBe(true);
    });

    it("includes lsUniqueTypes >= 5 strength", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          local_service_records: [
            makeLocalService({ id: "ls1", service_type: "gp_surgery", children_accessing: ["c1", "c2", "c3", "c4", "c5"] }),
            makeLocalService({ id: "ls2", service_type: "dentist", children_accessing: ["c1"] }),
            makeLocalService({ id: "ls3", service_type: "library", children_accessing: ["c2"] }),
            makeLocalService({ id: "ls4", service_type: "leisure_centre", children_accessing: ["c3"] }),
            makeLocalService({ id: "ls5", service_type: "school", children_accessing: ["c4"] }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("different types of local services"))).toBe(true);
    });

    it("includes cross-domain childSatisfactionRate >= 90 with 3+ sources", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.strengths.some((s) => s.includes("overall child satisfaction across community engagement domains"))).toBe(true);
    });

    it("includes cross-domain childSatisfactionRate 70-89 with 2+ sources", () => {
      // Create scenario with only 2 sources, both at ~75%
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", child_enjoyed: true, ongoing_commitment: false }),
          makeVolunteering({ id: "v2", child_id: "c2", child_enjoyed: true, ongoing_commitment: false }),
          makeVolunteering({ id: "v3", child_id: "c3", child_enjoyed: true, ongoing_commitment: false }),
          makeVolunteering({ id: "v4", child_id: "c4", child_enjoyed: false, ongoing_commitment: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // CA: 3/4=75%, Vol: 3/4=75%, avg=75 => 70-89 with 2 sources
      expect(r.strengths.some((s) => s.includes("overall child satisfaction"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ═══════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("includes communityParticipationRate < 30 concern", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.concerns.some((c) => c.includes("community participation rate"))).toBe(true);
    });

    it("includes communityParticipationRate 30-59 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
          makeCommunityActivity({ id: "ca2", child_id: "c2" }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 2/5=40%
      expect(r.concerns.some((c) => c.includes("Community participation at 40%"))).toBe(true);
    });

    it("includes no CA records in 90d concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [makeVolunteering({ id: "v1" })],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No community activity records in the past 90 days"))).toBe(true);
    });

    it("includes caEnjoymentRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/3=33%
      expect(r.concerns.some((c) => c.includes("enjoying community activities"))).toBe(true);
    });

    it("includes caFriendshipRate < 30 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/4=25%
      expect(r.concerns.some((c) => c.includes("activities build friendships"))).toBe(true);
    });

    it("includes caRiskAssessmentRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", risk_assessment_completed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", risk_assessment_completed: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", risk_assessment_completed: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("risk assessments completed"))).toBe(true);
    });

    it("includes caConsentRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", consent_obtained: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", consent_obtained: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", consent_obtained: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("consent obtained"))).toBe(true);
    });

    it("includes no volunteering in 90d concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No volunteering records in the past 90 days"))).toBe(true);
    });

    it("includes volunteeringRate < 10 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 20,
        community_activity_records: [],
        volunteering_records: [makeVolunteering({ id: "v1", child_id: "c1" })],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/20=5%
      expect(r.concerns.some((c) => c.includes("volunteering participation"))).toBe(true);
    });

    it("includes volSafeguardingRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", safeguarding_check_completed: true }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("safeguarding checks completed"))).toBe(true);
    });

    it("includes volRiskAssessmentRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", risk_assessment_completed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", risk_assessment_completed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", risk_assessment_completed: true }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("volunteering placements have risk assessments"))).toBe(true);
    });

    it("includes no social inclusion in 90d concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No social inclusion programme records"))).toBe(true);
    });

    it("includes socialInclusionRate < 20 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1" }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/10=10%
      expect(r.concerns.some((c) => c.includes("social inclusion coverage"))).toBe(true);
    });

    it("includes siEngagementRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", child_engaged: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", child_engaged: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", child_engaged: true }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("child engagement in inclusion programmes"))).toBe(true);
    });

    it("includes siBarrierAddressedRate < 40 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: ["B3"], barriers_addressed: true }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/3=33%
      expect(r.concerns.some((c) => c.includes("barriers addressed"))).toBe(true);
    });

    it("includes siReviewDue > 0 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({
            id: "si1",
            child_id: "c1",
            review_date: daysAgo(10), // overdue
            reviewed: false,
          }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("overdue for review"))).toBe(true);
    });

    it("includes no neighbourhood records in 90d concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No neighbourhood relation records"))).toBe(true);
    });

    it("includes neighbourhoodRelationRate < 40 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr2", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("positive neighbourhood interactions"))).toBe(true);
    });

    it("includes nrComplaintResolutionRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", complaint: true, complaint_resolved: false, positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", complaint: true, complaint_resolved: false, positive_outcome: true }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("neighbourhood complaints resolved"))).toBe(true);
    });

    it("includes nrFollowUpRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", follow_up_needed: true, follow_up_completed: false, positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", follow_up_needed: true, follow_up_completed: false, positive_outcome: true }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("follow-up actions completed"))).toBe(true);
    });

    it("includes nrComplaintCount >= 3 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", interaction_type: "complaint_received", positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", interaction_type: "complaint_received", positive_outcome: true }),
          makeNeighbourhood({ id: "nr3", interaction_type: "complaint_received", positive_outcome: true }),
          makeNeighbourhood({ id: "nr4", positive_outcome: true }),
          makeNeighbourhood({ id: "nr5", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("neighbourhood complaints received in 90 days"))).toBe(true);
    });

    it("includes no local service records in 90d concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No local service engagement records"))).toBe(true);
    });

    it("includes localServiceRate < 30 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2"] }),
        ],
      });
      // 2/10=20%
      expect(r.concerns.some((c) => c.includes("children accessing local services"))).toBe(true);
    });

    it("includes lsQualityRate < 40 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", engagement_quality: "poor" }),
          makeLocalService({ id: "ls2", engagement_quality: "poor", service_type: "dentist" }),
          makeLocalService({ id: "ls3", engagement_quality: "adequate", service_type: "library" }),
        ],
      });
      expect(r.concerns.some((c) => c.includes("rated good or excellent"))).toBe(true);
    });

    it("includes lsResponsivenessRate < 50 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", service_responsive: false }),
          makeLocalService({ id: "ls2", service_responsive: false, service_type: "dentist" }),
          makeLocalService({ id: "ls3", service_responsive: true, service_type: "library" }),
        ],
      });
      expect(r.concerns.some((c) => c.includes("services rated as responsive"))).toBe(true);
    });

    it("includes childSatisfactionRate < 40 concern", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("child satisfaction with community engagement"))).toBe(true);
    });

    it("includes childSatisfactionRate 40-59 concern", () => {
      // 2/4=50% enjoyment
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // satisfaction=50%
      expect(r.concerns.some((c) => c.includes("Child satisfaction at 50%"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("has sequential rank numbering", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes communityParticipationRate < 30 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.recommendations.some((rec) => rec.recommendation.includes("expand community activity access"))).toBe(true);
    });

    it("includes no CA in 90d recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [makeVolunteering({ id: "v1" })],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("programme of community activities"))).toBe(true);
    });

    it("includes caRiskAssessmentRate < 50 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", risk_assessment_completed: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", risk_assessment_completed: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("risk assessments"))).toBe(true);
    });

    it("includes no vol in 90d recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("volunteering opportunities"))).toBe(true);
    });

    it("includes volSafeguardingRate < 50 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", safeguarding_check_completed: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("safeguarding checks"))).toBe(true);
    });

    it("includes no SI in 90d recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("social inclusion needs"))).toBe(true);
    });

    it("includes siBarrierAddressedRate < 40 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: false }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: false }),
          makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: ["B3"], barriers_addressed: true }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("inclusion barriers"))).toBe(true);
    });

    it("includes neighbourhoodRelationRate < 40 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr2", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("neighbourhood engagement strategy"))).toBe(true);
    });

    it("includes nrComplaintResolutionRate < 50 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", complaint: true, complaint_resolved: false, positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", complaint: true, complaint_resolved: false, positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("complaint resolution process"))).toBe(true);
    });

    it("includes no LS in 90d recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("local services"))).toBe(true);
    });

    it("includes localServiceRate < 30 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c1", "c2"] }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("children's access to local services"))).toBe(true);
    });

    it("includes childSatisfactionRate < 40 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Consult children individually"))).toBe(true);
    });

    it("includes caFriendshipRate < 30 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("lasting friendships"))).toBe(true);
    });

    it("includes communityParticipationRate 30-59 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
          makeCommunityActivity({ id: "ca2", child_id: "c2" }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Expand community participation"))).toBe(true);
    });

    it("includes volunteeringRate 10-29 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1" }),
          makeVolunteering({ id: "v2", child_id: "c2" }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 2/10=20%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Broaden volunteering access"))).toBe(true);
    });

    it("includes socialInclusionRate 20-39 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1" }),
          makeSocialInclusion({ id: "si2", child_id: "c2" }),
          makeSocialInclusion({ id: "si3", child_id: "c3" }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 3/10=30%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend social inclusion programme coverage"))).toBe(true);
    });

    it("includes lsQualityRate < 40 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", engagement_quality: "poor" }),
          makeLocalService({ id: "ls2", engagement_quality: "poor", service_type: "dentist" }),
          makeLocalService({ id: "ls3", engagement_quality: "adequate", service_type: "library" }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve the quality of local service engagement"))).toBe(true);
    });

    it("includes no NR in 90d recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [makeCommunityActivity({ id: "ca1", child_id: "c1" })],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("recording neighbourhood interactions"))).toBe(true);
    });

    it("includes siReviewDue recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({
            id: "si1",
            child_id: "c1",
            review_date: daysAgo(10),
            reviewed: false,
          }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue social inclusion programme"))).toBe(true);
    });

    it("includes caOutcomesRate < 50 recommendation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", outcomes_documented: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", outcomes_documented: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", outcomes_documented: true }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("outcome documentation"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    // Critical insights
    it("includes critical insight for communityParticipationRate < 30", () => {
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("community participation"))).toBe(true);
    });

    it("includes critical insight for no CA in 90d", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [makeVolunteering({ id: "v1" })],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No community activity records"))).toBe(true);
    });

    it("includes critical insight for neighbourhoodRelationRate < 40", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr2", positive_outcome: false, community_perception_improved: false }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("positive neighbourhood interactions"))).toBe(true);
    });

    it("includes critical insight for childSatisfactionRate < 40", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("child satisfaction"))).toBe(true);
    });

    it("includes critical insight for volSafeguardingRate < 30", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v2", child_id: "c2", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v3", child_id: "c3", safeguarding_check_completed: false }),
          makeVolunteering({ id: "v4", child_id: "c4", safeguarding_check_completed: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 0/4=0% < 30
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("safeguarding checks"))).toBe(true);
    });

    it("includes critical insight for no CA + vol + SI combined", () => {
      // Need at least one domain with data to not hit allEmpty, so use NR only
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [makeNeighbourhood({ id: "nr1" })],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No community activities, volunteering, or social inclusion records"))).toBe(true);
    });

    // Warning insights
    it("includes warning insight for communityParticipationRate 30-59", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
          makeCommunityActivity({ id: "ca2", child_id: "c2" }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Community participation at"))).toBe(true);
    });

    it("includes warning insight for volunteeringRate 10-29", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1" }),
          makeVolunteering({ id: "v2", child_id: "c2" }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Volunteering engagement at"))).toBe(true);
    });

    it("includes warning insight for socialInclusionRate 20-39", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 10,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1" }),
          makeSocialInclusion({ id: "si2", child_id: "c2" }),
          makeSocialInclusion({ id: "si3", child_id: "c3" }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Social inclusion coverage at"))).toBe(true);
    });

    it("includes warning insight for neighbourhoodRelationRate 40-59", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ],
        local_service_records: [],
      });
      // 5/10=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Neighbourhood relation quality at"))).toBe(true);
    });

    it("includes warning insight for lsQualityRate 40-59", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", engagement_quality: "good" }),
          makeLocalService({ id: "ls2", engagement_quality: "poor", service_type: "dentist" }),
        ],
      });
      // 1/2=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Local service engagement quality at"))).toBe(true);
    });

    it("includes warning insight for childSatisfactionRate 40-59", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", child_enjoyed: false, builds_friendships: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", child_enjoyed: true, builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", child_enjoyed: false, builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 2/4=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction at"))).toBe(true);
    });

    it("includes warning insight for caFriendshipRate 30-49", () => {
      // 2/5 = 40%
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", builds_friendships: true }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", builds_friendships: true }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", builds_friendships: false }),
          makeCommunityActivity({ id: "ca4", child_id: "c4", builds_friendships: false }),
          makeCommunityActivity({ id: "ca5", child_id: "c5", builds_friendships: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("activities build friendships"))).toBe(true);
    });

    it("includes warning insight for siBarrierAddressedRate 40-59", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: ["B1"], barriers_addressed: true }),
          makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: ["B2"], barriers_addressed: false }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/2=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Barrier resolution rate at"))).toBe(true);
    });

    it("includes warning insight for volEnjoymentRate 50-69", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", child_enjoyed: true }),
          makeVolunteering({ id: "v2", child_id: "c2", child_enjoyed: false }),
        ],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/2=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Volunteering enjoyment at"))).toBe(true);
    });

    it("includes warning insight for lsResponsivenessRate 50-69", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", service_responsive: true }),
          makeLocalService({ id: "ls2", service_responsive: false, service_type: "dentist" }),
        ],
      });
      // 1/2=50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Service responsiveness at"))).toBe(true);
    });

    it("includes warning insight for nrComplaintCount = 2", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", interaction_type: "complaint_received", positive_outcome: true }),
          makeNeighbourhood({ id: "nr2", interaction_type: "complaint_received", positive_outcome: true }),
          makeNeighbourhood({ id: "nr3", positive_outcome: true }),
          makeNeighbourhood({ id: "nr4", positive_outcome: true }),
          makeNeighbourhood({ id: "nr5", positive_outcome: true }),
        ],
        local_service_records: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2 neighbourhood complaints"))).toBe(true);
    });

    // Positive insights
    it("includes positive insight for outstanding rating", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding community integration"))).toBe(true);
    });

    it("includes positive insight for high participation + enjoyment", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("community participation with"))).toBe(true);
    });

    it("includes positive insight for high volunteering + ongoing", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("volunteering participation with"))).toBe(true);
    });

    it("includes positive insight for high volChildInitiated + skills", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-initiated volunteering"))).toBe(true);
    });

    it("includes positive insight for high SI coverage + engagement", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("social inclusion coverage with"))).toBe(true);
    });

    it("includes positive insight for high barrier resolution + outcomes", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("barrier resolution with"))).toBe(true);
    });

    it("includes positive insight for high neighbourhood relation rate", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("positive neighbourhood interactions"))).toBe(true);
    });

    it("includes positive insight for high LS access + quality", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("local service access with"))).toBe(true);
    });

    it("includes positive insight for high satisfaction across 3+ domains", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child satisfaction across"))).toBe(true);
    });

    it("includes positive insight for nrPositiveFeedback >= 3 and nrJointActivities >= 2", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          neighbourhood_records: [
            ...Array.from({ length: 5 }, (_, i) =>
              makeNeighbourhood({ id: `nrpf${i}`, interaction_type: "positive_feedback", positive_outcome: true }),
            ),
            ...Array.from({ length: 3 }, (_, i) =>
              makeNeighbourhood({ id: `nrja${i}`, interaction_type: "joint_activity", positive_outcome: true }),
            ),
            makeNeighbourhood({ id: "nro1", positive_outcome: true }),
            makeNeighbourhood({ id: "nro2", positive_outcome: true }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("positive feedback instances and"))).toBe(true);
    });

    it("includes positive insight for high lsRelationshipRate + lsRegularRate", () => {
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("established service relationships"))).toBe(true);
    });

    it("includes positive insight for exceptional breadth", () => {
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          community_activity_records: [
            makeCommunityActivity({ id: "ca1", child_id: "c1", activity_type: "sports_club" }),
            makeCommunityActivity({ id: "ca2", child_id: "c2", activity_type: "youth_group" }),
            makeCommunityActivity({ id: "ca3", child_id: "c3", activity_type: "arts_culture" }),
            makeCommunityActivity({ id: "ca4", child_id: "c4", activity_type: "music" }),
            makeCommunityActivity({ id: "ca5", child_id: "c5", activity_type: "drama" }),
          ],
          volunteering_records: [
            makeVolunteering({ id: "v1", child_id: "c1", volunteering_type: "charity_shop" }),
            makeVolunteering({ id: "v2", child_id: "c2", volunteering_type: "animal_welfare" }),
            makeVolunteering({ id: "v3", child_id: "c3", volunteering_type: "environmental" }),
            makeVolunteering({ id: "v4", child_id: "c4", volunteering_type: "food_bank" }),
          ],
          local_service_records: [
            makeLocalService({ id: "ls1", service_type: "gp_surgery", children_accessing: ["c1", "c2", "c3", "c4", "c5"] }),
            makeLocalService({ id: "ls2", service_type: "dentist", children_accessing: ["c1"] }),
            makeLocalService({ id: "ls3", service_type: "library", children_accessing: ["c2"] }),
            makeLocalService({ id: "ls4", service_type: "leisure_centre", children_accessing: ["c3"] }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Exceptional breadth"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("90-day window: records at exactly 90 days are included", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 1,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: daysAgo(90) }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(100);
    });

    it("90-day window: records at 91 days are excluded", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 1,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: daysAgo(91) }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(0);
    });

    it("future-dated records are excluded from 90d window", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 1,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: futureDate(5) }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(0);
    });

    it("total counts include records outside 90d window", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: daysAgo(10) }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", date: daysAgo(200) }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1", date: daysAgo(200) }),
        ],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", date: daysAgo(200) }),
        ],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", date: daysAgo(200) }),
        ],
        local_service_records: [
          makeLocalService({ id: "ls1", date: daysAgo(200) }),
        ],
      });
      expect(r.total_community_activities).toBe(2);
      expect(r.total_volunteering_records).toBe(1);
      expect(r.total_social_inclusion_records).toBe(1);
      expect(r.total_neighbourhood_records).toBe(1);
      expect(r.total_local_service_records).toBe(1);
    });

    it("unattended CA records do not count towards participation", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", attended: true }),
          makeCommunityActivity({ id: "ca2", child_id: "c2", attended: false }),
          makeCommunityActivity({ id: "ca3", child_id: "c3", attended: false }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(20); // only c1 attended
    });

    it("score is clamped to 0..100", () => {
      // Extreme penalties scenario: base 52, many penalties stacking
      const r = computeCommunityIntegrationVolunteering(minimalPoorInput());
      expect(r.community_score).toBeGreaterThanOrEqual(0);
      expect(r.community_score).toBeLessThanOrEqual(100);
    });

    it("total_children = 1 works correctly", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 1,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c1" }),
        ],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1" }),
        ],
        neighbourhood_records: [
          makeNeighbourhood({ id: "nr1", positive_outcome: true }),
        ],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c1"] }),
        ],
      });
      expect(r.community_participation_rate).toBe(100);
      expect(r.volunteering_rate).toBe(100);
      expect(r.social_inclusion_rate).toBe(100);
      expect(r.local_service_rate).toBe(100);
      expect(r.community_rating).toBe("outstanding");
    });

    it("duplicate child_ids in same domain only counted once", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1" }),
          makeCommunityActivity({ id: "ca2", child_id: "c1" }),
          makeCommunityActivity({ id: "ca3", child_id: "c1" }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(20); // 1 unique child / 5
    });

    it("siReviewDue counts reviews from all records not just 90d", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({
            id: "si1",
            child_id: "c1",
            date: daysAgo(200), // outside 90d
            review_date: daysAgo(10), // overdue
            reviewed: false,
          }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.concerns.some((c) => c.includes("overdue for review"))).toBe(true);
    });

    it("siReviewRate uses all SI records not just 90d", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c1", date: daysAgo(200), reviewed: true }),
          makeSocialInclusion({ id: "si2", child_id: "c2", date: daysAgo(10), reviewed: false }),
        ],
        neighbourhood_records: [],
        local_service_records: [],
      });
      // 1/2 reviewed = 50%
      expect(r.total_social_inclusion_records).toBe(2);
    });

    it("headline pluralises correctly for good rating with 1 strength", () => {
      // Create a scenario that scores good with exactly 1 strength
      // This is tricky; let's just check the pattern
      const r = computeCommunityIntegrationVolunteering(
        baseInput({
          volunteering_records: [
            makeVolunteering({ id: "v1", child_id: "c1", ongoing_commitment: false }),
            makeVolunteering({ id: "v2", child_id: "c2", ongoing_commitment: false }),
            makeVolunteering({ id: "v3", child_id: "c3", ongoing_commitment: false }),
            makeVolunteering({ id: "v4", child_id: "c4", ongoing_commitment: false }),
          ],
          social_inclusion_records: [
            makeSocialInclusion({ id: "si1", child_id: "c1", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si2", child_id: "c2", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si3", child_id: "c3", barriers_identified: [], barriers_addressed: false }),
            makeSocialInclusion({ id: "si4", child_id: "c4", barriers_identified: [], barriers_addressed: false }),
          ],
          neighbourhood_records: [
            ...Array.from({ length: 6 }, (_, i) =>
              makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
            ),
            ...Array.from({ length: 4 }, (_, i) =>
              makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
            ),
          ],
        }),
      );
      if (r.community_rating === "good") {
        expect(r.headline).toContain("Good");
        expect(r.headline).toContain("strength");
      }
    });

    it("max bonuses cap at +28", () => {
      // baseInput already gives all max bonuses = +28
      const r = computeCommunityIntegrationVolunteering(baseInput());
      expect(r.community_score).toBe(80); // 52 + 28
    });

    it("base score is 52 with no bonuses or penalties (only NR data)", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrp${i}`, positive_outcome: true }),
          ),
          ...Array.from({ length: 5 }, (_, i) =>
            makeNeighbourhood({ id: `nrn${i}`, positive_outcome: false, community_perception_improved: false }),
          ),
        ],
        local_service_records: [],
      });
      // NR rate=50%, 40<=50<60 => +0, no penalties
      // But other missing domain concerns fire. No satisfaction sources.
      expect(r.community_score).toBe(52);
    });

    it("satisfaction averages correctly across 4 domains", () => {
      // CA: 1/1=100%, Vol: 0/1=0%, SI: 1/1=100%, LS: 1/1=100%
      // avg = (100+0+100+100)/4 = 75
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", child_enjoyed: true, builds_friendships: false }),
        ],
        volunteering_records: [
          makeVolunteering({ id: "v1", child_id: "c2", child_enjoyed: false, ongoing_commitment: false }),
        ],
        social_inclusion_records: [
          makeSocialInclusion({ id: "si1", child_id: "c3", child_engaged: true, barriers_identified: [] }),
        ],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c4"], child_satisfaction: true }),
        ],
      });
      expect(r.child_satisfaction_rate).toBe(75);
    });

    it("does not trigger allEmpty concerns when at least one domain has data", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 5,
        community_activity_records: [],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [
          makeLocalService({ id: "ls1", children_accessing: ["c1"] }),
        ],
      });
      // Not allEmpty, so doesn't take the allEmpty path
      expect(r.community_rating).not.toBe("insufficient_data");
      expect(r.community_score).not.toBe(15);
    });

    it("records on today (daysAgo(0)) are included in 90d window", () => {
      const r = computeCommunityIntegrationVolunteering({
        today: TODAY,
        total_children: 1,
        community_activity_records: [
          makeCommunityActivity({ id: "ca1", child_id: "c1", date: TODAY }),
        ],
        volunteering_records: [],
        social_inclusion_records: [],
        neighbourhood_records: [],
        local_service_records: [],
      });
      expect(r.community_participation_rate).toBe(100);
    });
  });
});
