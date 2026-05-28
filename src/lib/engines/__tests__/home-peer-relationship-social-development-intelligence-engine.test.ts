// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PEER RELATIONSHIP & SOCIAL DEVELOPMENT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePeerRelationshipSocialDevelopment,
  type PeerRelationshipSocialDevelopmentInput,
  type PeerAssessmentInput,
  type SocialSkillsProgrammeInput,
  type BullyingIncidentInput,
  type FriendshipSupportPlanInput,
  type SocialActivityRecordInput,
} from "../home-peer-relationship-social-development-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<PeerRelationshipSocialDevelopmentInput> = {},
): PeerRelationshipSocialDevelopmentInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    peer_assessments: [],
    social_skills_programmes: [],
    bullying_incidents: [],
    friendship_support_plans: [],
    social_activity_records: [],
    ...overrides,
  };
}

function makePeerAssessment(
  overrides: Partial<PeerAssessmentInput> = {},
): PeerAssessmentInput {
  return {
    id: "pa_test",
    child_id: "child_1",
    assessment_date: "2026-05-20",
    assessor_role: "keyworker",
    relationship_quality_score: 4,
    social_confidence_score: 4,
    conflict_resolution_score: 4,
    empathy_score: 4,
    cooperation_score: 4,
    peer_acceptance_score: 4,
    areas_of_strength: ["empathy"],
    areas_of_concern: [],
    recommended_interventions: [],
    child_voice_captured: true,
    follow_up_date: null,
    follow_up_completed: false,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeSocialSkillsProgramme(
  overrides: Partial<SocialSkillsProgrammeInput> = {},
): SocialSkillsProgrammeInput {
  return {
    id: "ssp_test",
    child_id: "child_1",
    programme_name: "Social Skills Group",
    programme_type: "group",
    start_date: "2026-01-01",
    end_date: null,
    active: true,
    sessions_planned: 10,
    sessions_attended: 9,
    progress_rating: 4,
    skills_targeted: ["communication"],
    measurable_improvement: true,
    child_engaged: true,
    facilitator_name: "Staff A",
    review_date: "2026-06-01",
    review_completed: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeBullyingIncident(
  overrides: Partial<BullyingIncidentInput> = {},
): BullyingIncidentInput {
  return {
    id: "bi_test",
    child_id: "child_1",
    incident_date: "2026-05-15",
    reported_date: "2026-05-15",
    incident_type: "verbal",
    severity: "low",
    child_role: "victim",
    reported_by: "Staff A",
    investigated: true,
    investigation_date: "2026-05-15",
    resolution_type: "restorative",
    resolved: true,
    resolution_date: "2026-05-16",
    resolution_description: "Resolved via mediation",
    safety_plan_created: true,
    follow_up_completed: true,
    follow_up_date: "2026-05-22",
    child_satisfied_with_outcome: true,
    days_to_investigate: 0,
    days_to_resolve: 1,
    parent_carer_informed: true,
    social_worker_informed: true,
    lessons_learned: "Improved communication",
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeFriendshipSupportPlan(
  overrides: Partial<FriendshipSupportPlanInput> = {},
): FriendshipSupportPlanInput {
  return {
    id: "fsp_test",
    child_id: "child_1",
    plan_date: "2026-04-01",
    plan_type: "formal",
    identified_needs: ["peer matching"],
    goals_set: 5,
    goals_achieved: 4,
    activities_planned: 5,
    activities_completed: 5,
    external_friendships_supported: true,
    family_contact_supported: true,
    peer_matching_attempted: true,
    peer_matching_successful: true,
    child_voice_in_plan: true,
    review_date: "2026-07-01",
    review_completed: true,
    active: true,
    progress_notes: "Good progress",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeSocialActivityRecord(
  overrides: Partial<SocialActivityRecordInput> = {},
): SocialActivityRecordInput {
  return {
    id: "sar_test",
    child_id: "child_1",
    activity_date: "2026-05-20",
    activity_type: "sport",
    activity_name: "Football",
    group_activity: true,
    external_activity: true,
    peer_interaction_quality: 4,
    child_enjoyed: true,
    child_initiated: true,
    new_connections_made: true,
    staff_supported: true,
    duration_hours: 2,
    attendance_status: "attended",
    barriers_identified: [],
    created_at: "2026-05-20",
    ...overrides,
  };
}

// ── Special Cases ──────────────────────────────────────────────────────────

describe("computePeerRelationshipSocialDevelopment", () => {
  describe("Special cases", () => {
    it("returns insufficient_data when all arrays empty and total_children = 0", () => {
      const r = computePeerRelationshipSocialDevelopment(baseInput());
      expect(r.peer_rating).toBe("insufficient_data");
      expect(r.peer_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
    });

    it("returns inadequate with score 15 when all arrays empty and total_children > 0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 4 }),
      );
      expect(r.peer_rating).toBe("inadequate");
      expect(r.peer_score).toBe(15);
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("insufficient_data result has all totals at 0", () => {
      const r = computePeerRelationshipSocialDevelopment(baseInput());
      expect(r.total_assessments).toBe(0);
      expect(r.total_programmes).toBe(0);
      expect(r.total_bullying_incidents).toBe(0);
      expect(r.total_friendship_plans).toBe(0);
      expect(r.total_social_activities).toBe(0);
    });

    it("insufficient_data result has all rates at 0", () => {
      const r = computePeerRelationshipSocialDevelopment(baseInput());
      expect(r.peer_assessment_coverage_rate).toBe(0);
      expect(r.social_skills_engagement_rate).toBe(0);
      expect(r.bullying_resolution_rate).toBe(0);
      expect(r.friendship_plan_coverage_rate).toBe(0);
      expect(r.social_activity_participation_rate).toBe(0);
    });

    it("inadequate empty result has correct recommendations urgency", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });
  });

  // ── Base Score ────────────────────────────────────────────────────────────

  describe("Base score", () => {
    it("base score is 52 with minimal data, no bonuses, no penalties", () => {
      // 3 children, 1 assessment => coverage 33% => no bonus (need >=70), no penalty (need <30)
      // child_voice_captured: false to avoid voice bonus
      // relationship_quality_score: 2 to avoid quality bonus (need >=3.0)
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.peer_score).toBe(52);
    });
  });

  // ── Bonuses ───────────────────────────────────────────────────────────────

  describe("Bonus 1: peerAssessmentCoverageRate", () => {
    it("+4 when coverage >= 90%", () => {
      const assessments = Array.from({ length: 9 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(90);
      expect(r.peer_score).toBe(52 + 4);
    });

    it("+2 when coverage >= 70% but < 90%", () => {
      const assessments = Array.from({ length: 7 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(70);
      expect(r.peer_score).toBe(52 + 2);
    });

    it("+0 when coverage < 70% (but >=30 to avoid penalty)", () => {
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(50);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Bonus 2: socialSkillsEngagementRate", () => {
    it("+3 when engagement >= 80%", () => {
      const programmes = Array.from({ length: 4 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 5,
          measurable_improvement: false,
          child_engaged: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: programmes,
        }),
      );
      expect(r.social_skills_engagement_rate).toBe(80);
      // base 52 + bonus2 3 = 55. Penalty 2: coverage = pct(1,5)=20 < 30 => -4. => 51
      expect(r.peer_score).toBe(52 + 3 - 4);
    });

    it("+1 when engagement >= 60% but < 80%", () => {
      const programmes = Array.from({ length: 3 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 5,
          measurable_improvement: false,
          child_engaged: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: programmes,
        }),
      );
      expect(r.social_skills_engagement_rate).toBe(60);
      expect(r.peer_score).toBe(52 + 1 - 4);
    });

    it("+0 when engagement < 60%", () => {
      const programmes = Array.from({ length: 2 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 5,
          measurable_improvement: false,
          child_engaged: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: programmes,
        }),
      );
      expect(r.social_skills_engagement_rate).toBe(40);
      expect(r.peer_score).toBe(52 - 4);
    });
  });

  describe("Bonus 3: bullyingResolutionRate", () => {
    it("+3 when resolution rate = 100%", () => {
      const incidents = [
        makeBullyingIncident({
          id: "bi_1",
          resolved: true,
          severity: "low",
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "informal",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      ];
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.bullying_resolution_rate).toBe(100);
      expect(r.peer_score).toBe(52 + 3);
    });

    it("+1 when resolution rate >= 80% but < 100%", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeBullyingIncident({
          id: `bi_${i}`,
          child_id: `child_${i + 1}`,
          resolved: i < 4,
          severity: "low",
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "informal",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.bullying_resolution_rate).toBe(80);
      expect(r.peer_score).toBe(52 + 1);
    });

    it("+0 when resolution rate < 80% (but >=50 to avoid penalty)", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeBullyingIncident({
          id: `bi_${i}`,
          child_id: `child_${i + 1}`,
          resolved: i < 3,
          severity: "low",
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "informal",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.bullying_resolution_rate).toBe(60);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Bonus 4: friendshipPlanCoverageRate", () => {
    it("+3 when coverage >= 80%", () => {
      const plans = Array.from({ length: 4 }, (_, i) =>
        makeFriendshipSupportPlan({
          id: `fsp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          child_voice_in_plan: false,
          goals_set: 0,
          goals_achieved: 0,
          activities_planned: 0,
          activities_completed: 0,
          external_friendships_supported: false,
          family_contact_supported: false,
          peer_matching_attempted: false,
          peer_matching_successful: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: plans,
        }),
      );
      expect(r.friendship_plan_coverage_rate).toBe(80);
      // base 52 + bonus4 3. Penalty 2: coverage pct(1,5)=20 < 30 => -4. => 51
      expect(r.peer_score).toBe(52 + 3 - 4);
    });

    it("+1 when coverage >= 60% but < 80%", () => {
      const plans = Array.from({ length: 3 }, (_, i) =>
        makeFriendshipSupportPlan({
          id: `fsp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          child_voice_in_plan: false,
          goals_set: 0,
          goals_achieved: 0,
          activities_planned: 0,
          activities_completed: 0,
          external_friendships_supported: false,
          family_contact_supported: false,
          peer_matching_attempted: false,
          peer_matching_successful: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: plans,
        }),
      );
      expect(r.friendship_plan_coverage_rate).toBe(60);
      expect(r.peer_score).toBe(52 + 1 - 4);
    });

    it("+0 when coverage < 60%", () => {
      const plans = Array.from({ length: 2 }, (_, i) =>
        makeFriendshipSupportPlan({
          id: `fsp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          child_voice_in_plan: false,
          goals_set: 0,
          goals_achieved: 0,
          activities_planned: 0,
          activities_completed: 0,
          external_friendships_supported: false,
          family_contact_supported: false,
          peer_matching_attempted: false,
          peer_matching_successful: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: plans,
        }),
      );
      expect(r.friendship_plan_coverage_rate).toBe(40);
      expect(r.peer_score).toBe(52 - 4);
    });
  });

  describe("Bonus 5: socialActivityParticipationRate", () => {
    it("+3 when participation >= 90%", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          attendance_status: i < 9 ? "attended" : "missed",
          child_enjoyed: false,
          child_initiated: false,
          new_connections_made: false,
          group_activity: false,
          external_activity: false,
          peer_interaction_quality: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_activity_records: activities,
        }),
      );
      expect(r.social_activity_participation_rate).toBe(90);
      expect(r.peer_score).toBe(52 + 3);
    });

    it("+1 when participation >= 70% but < 90%", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          attendance_status: i < 7 ? "attended" : "missed",
          child_enjoyed: false,
          child_initiated: false,
          new_connections_made: false,
          group_activity: false,
          external_activity: false,
          peer_interaction_quality: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_activity_records: activities,
        }),
      );
      expect(r.social_activity_participation_rate).toBe(70);
      expect(r.peer_score).toBe(52 + 1);
    });

    it("+0 when participation < 70% (but >= 40 to avoid penalty)", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          attendance_status: i < 5 ? "attended" : "missed",
          child_enjoyed: false,
          child_initiated: false,
          new_connections_made: false,
          group_activity: false,
          external_activity: false,
          peer_interaction_quality: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_activity_records: activities,
        }),
      );
      expect(r.social_activity_participation_rate).toBe(50);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Bonus 6: combinedChildVoiceRate", () => {
    it("+3 when voice rate >= 90%", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: i < 9,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
        }),
      );
      expect(r.child_voice_in_plans_rate).toBe(90);
      // Also gets bonus 1: coverage 100% => +4, bonus 6: +3
      expect(r.peer_score).toBe(52 + 4 + 3);
    });

    it("+1 when voice rate >= 70% but < 90%", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: i < 7,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
        }),
      );
      expect(r.child_voice_in_plans_rate).toBe(70);
      // Also gets bonus 1: coverage 100% => +4, bonus 6: +1
      expect(r.peer_score).toBe(52 + 4 + 1);
    });

    it("+0 when voice rate < 70%", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: i < 5,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
        }),
      );
      expect(r.child_voice_in_plans_rate).toBe(50);
      // Only bonus 1: coverage 100% => +4
      expect(r.peer_score).toBe(52 + 4);
    });
  });

  describe("Bonus 7: averageRelationshipQuality", () => {
    it("+3 when avg quality >= 4.0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 4,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.average_relationship_quality).toBe(4);
      expect(r.peer_score).toBe(52 + 3);
    });

    it("+1 when avg quality >= 3.0 but < 4.0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 3,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.average_relationship_quality).toBe(3);
      expect(r.peer_score).toBe(52 + 1);
    });

    it("+0 when avg quality < 3.0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.average_relationship_quality).toBe(2);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Bonus 8: programmeAttendanceRate", () => {
    it("+3 when attendance >= 90%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: [
            makeSocialSkillsProgramme({
              active: false,
              sessions_planned: 10,
              sessions_attended: 9,
              measurable_improvement: false,
              child_engaged: false,
            }),
          ],
        }),
      );
      expect(r.programme_attendance_rate).toBe(90);
      expect(r.peer_score).toBe(52 + 3);
    });

    it("+1 when attendance >= 70% but < 90%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: [
            makeSocialSkillsProgramme({
              active: false,
              sessions_planned: 10,
              sessions_attended: 7,
              measurable_improvement: false,
              child_engaged: false,
            }),
          ],
        }),
      );
      expect(r.programme_attendance_rate).toBe(70);
      expect(r.peer_score).toBe(52 + 1);
    });

    it("+0 when attendance < 70%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_skills_programmes: [
            makeSocialSkillsProgramme({
              active: false,
              sessions_planned: 10,
              sessions_attended: 5,
              measurable_improvement: false,
              child_engaged: false,
            }),
          ],
        }),
      );
      expect(r.programme_attendance_rate).toBe(50);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Bonus 9: friendshipGoalAchievementRate", () => {
    it("+3 when achievement >= 80%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: [
            makeFriendshipSupportPlan({
              active: false,
              child_voice_in_plan: false,
              goals_set: 10,
              goals_achieved: 8,
              activities_planned: 0,
              activities_completed: 0,
              external_friendships_supported: false,
              family_contact_supported: false,
              peer_matching_attempted: false,
              peer_matching_successful: false,
            }),
          ],
        }),
      );
      expect(r.friendship_goal_achievement_rate).toBe(80);
      expect(r.peer_score).toBe(52 + 3);
    });

    it("+1 when achievement >= 60% but < 80%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: [
            makeFriendshipSupportPlan({
              active: false,
              child_voice_in_plan: false,
              goals_set: 10,
              goals_achieved: 6,
              activities_planned: 0,
              activities_completed: 0,
              external_friendships_supported: false,
              family_contact_supported: false,
              peer_matching_attempted: false,
              peer_matching_successful: false,
            }),
          ],
        }),
      );
      expect(r.friendship_goal_achievement_rate).toBe(60);
      expect(r.peer_score).toBe(52 + 1);
    });

    it("+0 when achievement < 60%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          friendship_support_plans: [
            makeFriendshipSupportPlan({
              active: false,
              child_voice_in_plan: false,
              goals_set: 10,
              goals_achieved: 3,
              activities_planned: 0,
              activities_completed: 0,
              external_friendships_supported: false,
              family_contact_supported: false,
              peer_matching_attempted: false,
              peer_matching_successful: false,
            }),
          ],
        }),
      );
      expect(r.friendship_goal_achievement_rate).toBe(30);
      expect(r.peer_score).toBe(52);
    });
  });

  // ── All bonuses combined ──────────────────────────────────────────────────

  describe("All bonuses combined", () => {
    it("achieves max score 80 (52 + 28) with all top-tier bonuses", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: true,
          relationship_quality_score: 5,
          social_confidence_score: 5,
          conflict_resolution_score: 5,
          empathy_score: 5,
          cooperation_score: 5,
          peer_acceptance_score: 5,
        }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 10,
        }),
      );
      const incidents = [
        makeBullyingIncident({ resolved: true, investigated: true }),
      ];
      const plans = Array.from({ length: 8 }, (_, i) =>
        makeFriendshipSupportPlan({
          id: `fsp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          child_voice_in_plan: true,
          goals_set: 10,
          goals_achieved: 8,
        }),
      );
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          child_id: `child_${(i % 10) + 1}`,
          attendance_status: i < 9 ? "attended" : "missed",
          child_enjoyed: true,
          child_initiated: true,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
          bullying_incidents: incidents,
          friendship_support_plans: plans,
          social_activity_records: activities,
        }),
      );
      expect(r.peer_score).toBe(80);
      expect(r.peer_rating).toBe("outstanding");
    });
  });

  // ── Penalties ─────────────────────────────────────────────────────────────

  describe("Penalty 1: bullyingResolutionRate < 50", () => {
    it("-5 when resolution < 50% and incidents > 0", () => {
      const incidents = Array.from({ length: 4 }, (_, i) =>
        makeBullyingIncident({
          id: `bi_${i}`,
          resolved: i === 0,
          severity: "low",
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "pending",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.bullying_resolution_rate).toBe(25);
      expect(r.peer_score).toBe(52 - 5);
    });

    it("no penalty when 0 incidents (pct returns 0 but guard prevents it)", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Penalty 2: peerAssessmentCoverageRate < 30", () => {
    it("-4 when coverage < 30% and children > 0", () => {
      const assessments = Array.from({ length: 2 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(20);
      expect(r.peer_score).toBe(52 - 4);
    });

    it("no penalty when total_children = 0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 0,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(0);
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Penalty 3: socialActivityParticipationRate < 40", () => {
    it("-5 when participation < 40% and activities > 0", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          attendance_status: i < 3 ? "attended" : "missed",
          child_enjoyed: false,
          child_initiated: false,
          new_connections_made: false,
          group_activity: false,
          external_activity: false,
          peer_interaction_quality: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          social_activity_records: activities,
        }),
      );
      expect(r.social_activity_participation_rate).toBe(30);
      expect(r.peer_score).toBe(52 - 5);
    });

    it("no penalty when 0 activities (guard prevents it)", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.peer_score).toBe(52);
    });
  });

  describe("Penalty 4: highSeverityUnresolved > 0", () => {
    it("-4 when high-severity unresolved incidents exist", () => {
      const incidents = [
        makeBullyingIncident({
          severity: "high",
          resolved: false,
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "pending",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      ];
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      // Penalty 1: resolution 0% < 50 => -5, penalty 4: high unresolved => -4
      expect(r.peer_score).toBe(52 - 5 - 4);
    });

    it("-4 for critical-severity unresolved", () => {
      const incidents = [
        makeBullyingIncident({
          severity: "critical",
          resolved: false,
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "pending",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      ];
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.peer_score).toBe(52 - 5 - 4);
    });

    it("no penalty for high-severity that IS resolved", () => {
      const incidents = [
        makeBullyingIncident({
          severity: "high",
          resolved: true,
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "informal",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      ];
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.peer_score).toBe(52 + 3);
    });

    it("no penalty for low-severity unresolved", () => {
      const incidents = [
        makeBullyingIncident({
          severity: "low",
          resolved: false,
          investigated: false,
          safety_plan_created: false,
          follow_up_completed: false,
          child_satisfied_with_outcome: false,
          parent_carer_informed: false,
          social_worker_informed: false,
          resolution_type: "pending",
          days_to_investigate: null,
          days_to_resolve: null,
        }),
      ];
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: incidents,
        }),
      );
      expect(r.peer_score).toBe(52 - 5);
    });
  });

  describe("Multiple penalties stack", () => {
    it("all 4 penalties apply simultaneously", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [
            makePeerAssessment({
              id: "pa_1",
              child_id: "child_1",
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
          bullying_incidents: [
            makeBullyingIncident({
              severity: "high",
              resolved: false,
              investigated: false,
              safety_plan_created: false,
              follow_up_completed: false,
              child_satisfied_with_outcome: false,
              parent_carer_informed: false,
              social_worker_informed: false,
              resolution_type: "pending",
              days_to_investigate: null,
              days_to_resolve: null,
            }),
          ],
          social_activity_records: Array.from({ length: 10 }, (_, i) =>
            makeSocialActivityRecord({
              id: `sar_${i}`,
              attendance_status: i < 2 ? "attended" : "refused",
              child_enjoyed: false,
              child_initiated: false,
              new_connections_made: false,
              group_activity: false,
              external_activity: false,
              peer_interaction_quality: 2,
            }),
          ),
        }),
      );
      // coverage: pct(1,10) = 10% < 30 => penalty 2 (-4)
      // resolution: 0% < 50 => penalty 1 (-5)
      // participation: pct(2,10)=20% < 40 => penalty 3 (-5)
      // high unresolved: 1 > 0 => penalty 4 (-4)
      expect(r.peer_score).toBe(52 - 5 - 4 - 5 - 4);
    });
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  describe("Rating boundaries", () => {
    it("score 80 = outstanding", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: true,
          relationship_quality_score: 5,
          social_confidence_score: 5,
          conflict_resolution_score: 5,
          empathy_score: 5,
          cooperation_score: 5,
          peer_acceptance_score: 5,
        }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 10,
        }),
      );
      const incidents = [
        makeBullyingIncident({ resolved: true, investigated: true }),
      ];
      const plans = Array.from({ length: 8 }, (_, i) =>
        makeFriendshipSupportPlan({
          id: `fsp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          child_voice_in_plan: true,
          goals_set: 10,
          goals_achieved: 8,
        }),
      );
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({
          id: `sar_${i}`,
          child_id: `child_${(i % 10) + 1}`,
          attendance_status: i < 9 ? "attended" : "missed",
          child_enjoyed: true,
          child_initiated: true,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
          bullying_incidents: incidents,
          friendship_support_plans: plans,
          social_activity_records: activities,
        }),
      );
      expect(r.peer_score).toBe(80);
      expect(r.peer_rating).toBe("outstanding");
    });

    it("score 65 = good (lower boundary)", () => {
      // 52 + 4 + 3 + 3 + 3 = 65
      // bonus1: coverage 100% (+4), bonus2: engagement 80% (+3), bonus7: quality 4.0 (+3), bonus8: attendance 90% (+3)
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 4,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 9,
          measurable_improvement: false,
          child_engaged: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
        }),
      );
      expect(r.peer_score).toBe(65);
      expect(r.peer_rating).toBe("good");
    });

    it("score 64 = adequate", () => {
      // 52 + 4 + 1 + 1 + 3 + 3 = 64
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: i < 7, // 70% => voice bonus tier2 (+1)
          relationship_quality_score: 4, // bonus7 +3
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const programmes = Array.from({ length: 6 }, (_, i) =>
        makeSocialSkillsProgramme({
          id: `ssp_${i}`,
          child_id: `child_${i + 1}`,
          active: true,
          sessions_planned: 10,
          sessions_attended: 9,
          measurable_improvement: false,
          child_engaged: false,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
        }),
      );
      // bonus1: coverage 100% => +4
      // bonus2: engagement pct(6,10)=60% => +1
      // bonus6: voice pct(7,10)=70% => +1
      // bonus7: quality 4.0 => +3
      // bonus8: attendance pct(54,60)=90% => +3
      expect(r.peer_score).toBe(64);
      expect(r.peer_rating).toBe("adequate");
    });

    it("score 45 = adequate (lower boundary)", () => {
      // 52 + 2 - 5 - 4 = 45
      // bonus1 tier2: coverage >= 70 (+2)
      // penalty3: participation < 40 (-5)
      // penalty4: high unresolved (-4)
      // Need resolution >= 50 to avoid penalty1
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 7,
          peer_assessments: assessments,
          bullying_incidents: [
            makeBullyingIncident({
              id: "bi_1",
              severity: "high",
              resolved: false,
              investigated: false,
              safety_plan_created: false,
              follow_up_completed: false,
              child_satisfied_with_outcome: false,
              parent_carer_informed: false,
              social_worker_informed: false,
              resolution_type: "pending",
              days_to_investigate: null,
              days_to_resolve: null,
            }),
            makeBullyingIncident({
              id: "bi_2",
              severity: "low",
              resolved: true,
              investigated: false,
              safety_plan_created: false,
              follow_up_completed: false,
              child_satisfied_with_outcome: false,
              parent_carer_informed: false,
              social_worker_informed: false,
              resolution_type: "informal",
              days_to_investigate: null,
              days_to_resolve: null,
            }),
          ],
          social_activity_records: Array.from({ length: 10 }, (_, i) =>
            makeSocialActivityRecord({
              id: `sar_${i}`,
              attendance_status: i < 3 ? "attended" : "refused",
              child_enjoyed: false,
              child_initiated: false,
              new_connections_made: false,
              group_activity: false,
              external_activity: false,
              peer_interaction_quality: 2,
            }),
          ),
        }),
      );
      expect(r.peer_score).toBe(45);
      expect(r.peer_rating).toBe("adequate");
    });

    it("score 44 = inadequate", () => {
      // 52 + 2 - 5 - 5 = 44
      // bonus1 tier2: coverage >= 70 (+2)
      // penalty1: resolution < 50 (-5)
      // penalty3: participation < 40 (-5)
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makePeerAssessment({
          id: `pa_${i}`,
          child_id: `child_${i + 1}`,
          child_voice_captured: false,
          relationship_quality_score: 2,
          social_confidence_score: 2,
          conflict_resolution_score: 2,
          empathy_score: 2,
          cooperation_score: 2,
          peer_acceptance_score: 2,
        }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 7,
          peer_assessments: assessments,
          bullying_incidents: [
            makeBullyingIncident({
              severity: "low",
              resolved: false,
              investigated: false,
              safety_plan_created: false,
              follow_up_completed: false,
              child_satisfied_with_outcome: false,
              parent_carer_informed: false,
              social_worker_informed: false,
              resolution_type: "pending",
              days_to_investigate: null,
              days_to_resolve: null,
            }),
          ],
          social_activity_records: Array.from({ length: 10 }, (_, i) =>
            makeSocialActivityRecord({
              id: `sar_${i}`,
              attendance_status: i < 3 ? "attended" : "refused",
              child_enjoyed: false,
              child_initiated: false,
              new_connections_made: false,
              group_activity: false,
              external_activity: false,
              peer_interaction_quality: 2,
            }),
          ),
        }),
      );
      expect(r.peer_score).toBe(44);
      expect(r.peer_rating).toBe("inadequate");
    });
  });

  // ── Metric Calculations ───────────────────────────────────────────────────

  describe("Metric calculations", () => {
    it("counts total_assessments correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.total_assessments).toBe(2);
    });

    it("counts total_programmes correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [
            makeSocialSkillsProgramme({ id: "ssp_1", active: false, sessions_planned: 10, sessions_attended: 5 }),
            makeSocialSkillsProgramme({ id: "ssp_2", active: false, sessions_planned: 10, sessions_attended: 5 }),
            makeSocialSkillsProgramme({ id: "ssp_3", active: false, sessions_planned: 10, sessions_attended: 5 }),
          ],
        }),
      );
      expect(r.total_programmes).toBe(3);
    });

    it("counts total_bullying_incidents correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [
            makeBullyingIncident({ id: "bi_1", resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
            makeBullyingIncident({ id: "bi_2", resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
          ],
        }),
      );
      expect(r.total_bullying_incidents).toBe(2);
    });

    it("counts total_friendship_plans correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [
            makeFriendshipSupportPlan({ id: "fsp_1", active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
          ],
        }),
      );
      expect(r.total_friendship_plans).toBe(1);
    });

    it("counts total_social_activities correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: [
            makeSocialActivityRecord({ id: "sar_1", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_2", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ],
        }),
      );
      expect(r.total_social_activities).toBe(2);
    });

    it("computes peer_assessment_coverage_rate as pct of unique children assessed", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(20);
    });

    it("computes social_skills_engagement_rate from active programmes only", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [
            makeSocialSkillsProgramme({ id: "ssp_1", child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
            makeSocialSkillsProgramme({ id: "ssp_2", child_id: "child_2", active: false, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
          ],
        }),
      );
      expect(r.social_skills_engagement_rate).toBe(20);
    });

    it("computes bullying_investigation_rate correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [
            makeBullyingIncident({ id: "bi_1", investigated: true, resolved: true, severity: "low", safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
            makeBullyingIncident({ id: "bi_2", investigated: false, resolved: true, severity: "low", safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
          ],
        }),
      );
      expect(r.bullying_investigation_rate).toBe(50);
    });

    it("computes average_relationship_quality with rounding", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 3, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: false, relationship_quality_score: 4, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_3", child_id: "child_3", child_voice_captured: false, relationship_quality_score: 5, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.average_relationship_quality).toBe(4);
    });

    it("computes average_social_confidence correctly", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 3, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 5, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.average_social_confidence).toBe(4);
    });

    it("computes programme_attendance_rate across all programmes", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [
            makeSocialSkillsProgramme({ id: "ssp_1", active: false, sessions_planned: 10, sessions_attended: 8, measurable_improvement: false, child_engaged: false }),
            makeSocialSkillsProgramme({ id: "ssp_2", active: false, sessions_planned: 10, sessions_attended: 6, measurable_improvement: false, child_engaged: false }),
          ],
        }),
      );
      expect(r.programme_attendance_rate).toBe(70);
    });

    it("computes friendship_goal_achievement_rate across all plans", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [
            makeFriendshipSupportPlan({ id: "fsp_1", active: false, child_voice_in_plan: false, goals_set: 10, goals_achieved: 5, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
            makeFriendshipSupportPlan({ id: "fsp_2", active: false, child_voice_in_plan: false, goals_set: 10, goals_achieved: 3, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
          ],
        }),
      );
      expect(r.friendship_goal_achievement_rate).toBe(40);
    });

    it("computes activity_enjoyment_rate from attended activities only", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: [
            makeSocialActivityRecord({ id: "sar_1", attendance_status: "attended", child_enjoyed: true, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_2", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_3", attendance_status: "missed", child_enjoyed: true, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ],
        }),
      );
      expect(r.activity_enjoyment_rate).toBe(50);
    });

    it("computes friendship_plan_coverage_rate from active plans only", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [
            makeFriendshipSupportPlan({ id: "fsp_1", child_id: "child_1", active: true, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
            makeFriendshipSupportPlan({ id: "fsp_2", child_id: "child_2", active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
            makeFriendshipSupportPlan({ id: "fsp_3", child_id: "child_3", active: true, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
          ],
        }),
      );
      expect(r.friendship_plan_coverage_rate).toBe(40);
    });

    it("computes child_voice_in_plans_rate as combined voice rate", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_voice_captured: true, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: true, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
          friendship_support_plans: [
            makeFriendshipSupportPlan({ active: false, child_voice_in_plan: true, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
          ],
        }),
      );
      expect(r.child_voice_in_plans_rate).toBe(100);
    });

    it("social_activity_participation_rate counts only attended", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: [
            makeSocialActivityRecord({ id: "sar_1", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_2", attendance_status: "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_3", attendance_status: "cancelled", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "sar_4", attendance_status: "missed", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ],
        }),
      );
      expect(r.social_activity_participation_rate).toBe(25);
    });

    it("pct(0,0) = 0 for all rate metrics when denominators are 0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 0,
          peer_assessments: [
            makePeerAssessment({
              child_voice_captured: false,
              relationship_quality_score: 2,
              social_confidence_score: 2,
              conflict_resolution_score: 2,
              empathy_score: 2,
              cooperation_score: 2,
              peer_acceptance_score: 2,
            }),
          ],
        }),
      );
      expect(r.bullying_resolution_rate).toBe(0);
      expect(r.bullying_investigation_rate).toBe(0);
      expect(r.friendship_goal_achievement_rate).toBe(0);
      expect(r.activity_enjoyment_rate).toBe(0);
      expect(r.programme_attendance_rate).toBe(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("includes 100% peer assessment coverage strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 2,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every child has received a peer relationship assessment"))).toBe(true);
    });

    it("includes 80% peer assessment coverage strength", () => {
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 5, peer_assessments: assessments }),
      );
      expect(r.strengths.some((s) => s.includes("80% peer assessment coverage"))).toBe(true);
    });

    it("includes relationship quality >= 4.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 4, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("high-quality peer relationships"))).toBe(true);
    });

    it("includes relationship quality >= 3.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 3, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("generally have positive peer relationships"))).toBe(true);
    });

    it("includes social confidence >= 4.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 4, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("strong social confidence"))).toBe(true);
    });

    it("includes 100% bullying resolution strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every bullying incident has been resolved"))).toBe(true);
    });

    it("includes no bullying incidents strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("No bullying incidents recorded"))).toBe(true);
    });

    it("includes >= 90% participation strength", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 9 ? "attended" : "missed", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("90% social activity participation rate"))).toBe(true);
    });

    it("includes >= 90% child voice strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ id: "pa_1", child_voice_captured: true, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: true, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Child voice captured in the vast majority"))).toBe(true);
    });

    it("includes child-initiated >= 30% strength", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: i < 3, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("child-initiated"))).toBe(true);
    });

    it("includes empathy and cooperation >= 4.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 4, cooperation_score: 4, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Empathy") && s.includes("cooperation"))).toBe(true);
    });

    it("includes conflict resolution >= 4.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 4, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Conflict resolution skills average 4/5"))).toBe(true);
    });

    it("includes safety plan >= 90% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: true, safety_plan_created: true, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Safety plans created for 100%"))).toBe(true);
    });

    it("includes restorative rate >= 50% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "restorative", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("restorative or mediation approaches"))).toBe(true);
    });

    it("includes external friendship >= 80% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: true, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("support external friendships"))).toBe(true);
    });

    it("includes new connections >= 40% strength", () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: i < 2, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("New peer connections"))).toBe(true);
    });

    it("includes group activity >= 60% strength", () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: i < 3, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("group-based"))).toBe(true);
    });

    it("includes peer interaction quality >= 4.0 strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: [makeSocialActivityRecord({ attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 4 })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Peer interaction quality during activities"))).toBe(true);
    });

    it("includes peer matching success >= 70% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: true, peer_matching_successful: true })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("peer matching success rate"))).toBe(true);
    });

    it("includes measurable improvement >= 80% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ active: false, sessions_planned: 10, sessions_attended: 5, measurable_improvement: true, child_engaged: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("measurable improvement"))).toBe(true);
    });

    it("includes external activity >= 50% strength", () => {
      const activities = Array.from({ length: 4 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: i < 2, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("external"))).toBe(true);
    });

    it("includes enjoyment >= 90% strength", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: i < 9, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("90% activity enjoyment rate"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("includes coverage < 30% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("10% of children have received peer relationship assessments"))).toBe(true);
    });

    it("includes coverage 30-69% concern", () => {
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("Peer assessment coverage at 50%"))).toBe(true);
    });

    it("includes relationship quality < 2.5 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Peer relationship quality averages only 2/5"))).toBe(true);
    });

    it("includes social confidence < 2.5 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Social confidence averages only 2/5"))).toBe(true);
    });

    it("includes bullying resolution < 50% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: false, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0% of bullying incidents resolved"))).toBe(true);
    });

    it("includes high severity unresolved concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "critical", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("high/critical severity bullying"))).toBe(true);
    });

    it("includes no social activities concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No social activities recorded"))).toBe(true);
    });

    it("includes no friendship plans concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No friendship support plans exist"))).toBe(true);
    });

    it("includes refusal rate >= 30% concern", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 7 ? "attended" : "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.concerns.some((c) => c.includes("activity refusal rate"))).toBe(true);
    });

    it("includes investigation < 80% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ id: "bi_1", investigated: false, resolved: true, severity: "low", safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0% of bullying incidents investigated"))).toBe(true);
    });

    it("includes parent/carer informed < 80% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: true, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: true, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Parents/carers informed in only 0%"))).toBe(true);
    });

    it("includes social worker informed < 80% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: true, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: true, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Social workers informed in only 0%"))).toBe(true);
    });

    it("includes empathy < 2.5 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Empathy scores average only 2/5"))).toBe(true);
    });

    it("includes peer acceptance < 2.5 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Peer acceptance scores average only 2/5"))).toBe(true);
    });

    it("includes conflict resolution < 2.5 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Conflict resolution skills average only 2/5"))).toBe(true);
    });

    it("includes child voice < 50% concern", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: i < 4, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.concerns.some((c) => c.includes("Child voice captured in only 40%"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("includes immediate recommendation for high severity unresolved", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently resolve all high/critical"))).toBe(true);
    });

    it("includes immediate recommendation for low resolution rate", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: false, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("structured bullying incident management"))).toBe(true);
    });

    it("includes immediate recommendation for low assessment coverage", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Conduct peer relationship assessments"))).toBe(true);
    });

    it("includes immediate recommendation for no social activities", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Establish a programme of structured social activities"))).toBe(true);
    });

    it("includes soon recommendation for coverage 30-69%", () => {
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend peer relationship assessments"))).toBe(true);
    });

    it("includes soon recommendation for resolution 50-79%", () => {
      const incidents = Array.from({ length: 4 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, resolved: i < 3, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve bullying resolution rate"))).toBe(true);
    });

    it("includes planned recommendation for engagement 30-59%", () => {
      const programmes = Array.from({ length: 4 }, (_, i) =>
        makeSocialSkillsProgramme({ id: `ssp_${i}`, child_id: `child_${i + 1}`, active: true, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: Array.from({ length: 4 }, (_, i) =>
            makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ),
          social_skills_programmes: programmes,
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Expand social skills programme provision"))).toBe(true);
    });

    it("includes planned recommendation for child-initiated < 15%", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: true, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Encourage children to initiate"))).toBe(true);
    });

    it("includes planned recommendation for no friendship plans", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Develop friendship support plans"))).toBe(true);
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations include regulatory_ref", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  describe("Insights", () => {
    it("critical insight for high severity unresolved", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("high or critical severity"))).toBe(true);
    });

    it("critical insight for low resolution rate", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: false, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0% of bullying incidents resolved"))).toBe(true);
    });

    it("critical insight for peer acceptance < 2.0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 1 })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Peer acceptance averaging only 1/5"))).toBe(true);
    });

    it("warning insight for avg days to resolve > 14", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: 20 })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20 days"))).toBe(true);
    });

    it("warning insight for bullying type patterns with >= 3 incidents", () => {
      const incidents = Array.from({ length: 3 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, incident_type: "verbal", resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Bullying incident patterns"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: true, relationship_quality_score: 5, social_confidence_score: 5, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 5 }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({ id: `ssp_${i}`, child_id: `child_${i + 1}`, active: true, sessions_planned: 10, sessions_attended: 10 }),
      );
      const plans = Array.from({ length: 8 }, (_, i) =>
        makeFriendshipSupportPlan({ id: `fsp_${i}`, child_id: `child_${i + 1}`, active: true, child_voice_in_plan: true, goals_set: 10, goals_achieved: 8 }),
      );
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, child_id: `child_${(i % 10) + 1}`, attendance_status: i < 9 ? "attended" : "missed", child_enjoyed: true, child_initiated: true }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: true })],
          friendship_support_plans: plans,
          social_activity_records: activities,
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for no bullying incidents", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No bullying incidents recorded"))).toBe(true);
    });

    it("positive insight for child-initiated >= 30%", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: i < 3, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-initiated"))).toBe(true);
    });

    it("positive insight for restorative rate >= 50%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "mediation", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("restorative approaches"))).toBe(true);
    });

    it("positive insight for peer matching success >= 70%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: true, peer_matching_successful: true })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("peer matching success"))).toBe(true);
    });

    it("positive insight for external friendship >= 80%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: true, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("support external friendships"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("Headlines", () => {
    it("outstanding headline", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: true, relationship_quality_score: 5, social_confidence_score: 5, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 5 }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({ id: `ssp_${i}`, child_id: `child_${i + 1}`, active: true, sessions_planned: 10, sessions_attended: 10 }),
      );
      const plans = Array.from({ length: 8 }, (_, i) =>
        makeFriendshipSupportPlan({ id: `fsp_${i}`, child_id: `child_${i + 1}`, active: true, child_voice_in_plan: true, goals_set: 10, goals_achieved: 8 }),
      );
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, child_id: `child_${(i % 10) + 1}`, attendance_status: i < 9 ? "attended" : "missed", child_enjoyed: true, child_initiated: true }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: assessments,
          social_skills_programmes: programmes,
          bullying_incidents: [makeBullyingIncident({ resolved: true, investigated: true })],
          friendship_support_plans: plans,
          social_activity_records: activities,
        }),
      );
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline includes strengths count", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 4, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const programmes = Array.from({ length: 8 }, (_, i) =>
        makeSocialSkillsProgramme({ id: `ssp_${i}`, child_id: `child_${i + 1}`, active: true, sessions_planned: 10, sessions_attended: 9 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments, social_skills_programmes: programmes }),
      );
      expect(r.peer_rating).toBe("good");
      expect(r.headline).toContain("Good");
      expect(r.headline).toMatch(/\d+ strength/);
    });

    it("adequate headline includes concerns count", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.peer_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("inadequate headline includes significant concerns", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
          social_activity_records: Array.from({ length: 10 }, (_, i) =>
            makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 2 ? "attended" : "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ),
        }),
      );
      expect(r.peer_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/\d+ significant concern/);
    });

    it("insufficient_data headline", () => {
      const r = computePeerRelationshipSocialDevelopment(baseInput());
      expect(r.headline).toContain("insufficient data");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 10,
          peer_assessments: [makePeerAssessment({ child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "critical", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
          social_activity_records: Array.from({ length: 10 }, (_, i) =>
            makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i === 0 ? "attended" : "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ),
        }),
      );
      expect(r.peer_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: true, relationship_quality_score: 5 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.peer_score).toBeLessThanOrEqual(100);
    });

    it("handles single child with comprehensive data", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 1,
          peer_assessments: [makePeerAssessment({ child_id: "child_1", child_voice_captured: true, relationship_quality_score: 5, social_confidence_score: 5, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 5 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ child_id: "child_1", active: true, sessions_planned: 10, sessions_attended: 10 })],
          bullying_incidents: [makeBullyingIncident({ child_id: "child_1", resolved: true })],
          friendship_support_plans: [makeFriendshipSupportPlan({ child_id: "child_1", active: true, child_voice_in_plan: true, goals_set: 5, goals_achieved: 5 })],
          social_activity_records: [makeSocialActivityRecord({ child_id: "child_1", attendance_status: "attended", child_enjoyed: true, child_initiated: true })],
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(100);
      expect(r.social_skills_engagement_rate).toBe(100);
      expect(r.friendship_plan_coverage_rate).toBe(100);
      expect(r.social_activity_participation_rate).toBe(100);
      expect(r.peer_rating).toBe("outstanding");
    });

    it("duplicate child_id in assessments counts as 1 unique child", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_3", child_id: "child_1", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(20);
    });

    it("inactive programmes do not count for engagement rate", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [
            makeSocialSkillsProgramme({ child_id: "child_1", active: false, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
            makeSocialSkillsProgramme({ id: "ssp_2", child_id: "child_2", active: false, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
          ],
        }),
      );
      expect(r.social_skills_engagement_rate).toBe(0);
    });

    it("inactive friendship plans do not count for coverage rate", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ child_id: "child_1", active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.friendship_plan_coverage_rate).toBe(0);
    });

    it("medium severity unresolved does NOT trigger penalty 4", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "medium", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.peer_score).toBe(52 - 5);
    });

    it("combined child voice uses both assessments and plans", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [
            makePeerAssessment({ id: "pa_1", child_voice_captured: true, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", child_id: "child_2", child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
          ],
          friendship_support_plans: [
            makeFriendshipSupportPlan({ id: "fsp_1", active: false, child_voice_in_plan: true, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
            makeFriendshipSupportPlan({ id: "fsp_2", active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
          ],
        }),
      );
      expect(r.child_voice_in_plans_rate).toBe(50);
    });

    it("social activity participation only counts attended status", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: [
            makeSocialActivityRecord({ id: "s1", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "s2", attendance_status: "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "s3", attendance_status: "cancelled", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "s4", attendance_status: "missed", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
            makeSocialActivityRecord({ id: "s5", attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
          ],
        }),
      );
      expect(r.social_activity_participation_rate).toBe(40);
    });

    it("restorative rate uses mediation as well as restorative", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [
            makeBullyingIncident({ id: "bi_1", resolved: true, resolution_type: "mediation", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, severity: "low", days_to_investigate: null, days_to_resolve: null }),
            makeBullyingIncident({ id: "bi_2", resolved: true, resolution_type: "restorative", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, severity: "low", days_to_investigate: null, days_to_resolve: null }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("restorative or mediation approaches"))).toBe(true);
    });

    it("high severity plural uses correct grammar", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [
            makeBullyingIncident({ id: "bi_1", severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null }),
            makeBullyingIncident({ id: "bi_2", severity: "critical", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 high/critical severity bullying incidents remain unresolved"))).toBe(true);
    });

    it("single high severity uses singular grammar", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [makeBullyingIncident({ severity: "high", resolved: false, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "pending", days_to_investigate: null, days_to_resolve: null })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 high/critical severity bullying incident remains unresolved"))).toBe(true);
    });

    it("total_children = 0 with some data still computes", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 0,
          peer_assessments: [makePeerAssessment({ child_voice_captured: true, relationship_quality_score: 5, social_confidence_score: 5, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 5 })],
        }),
      );
      expect(r.peer_assessment_coverage_rate).toBe(0);
      // bonus7: quality 5.0 >= 4.0 => +3, bonus6: voice 100% >= 90 => +3
      expect(r.peer_score).toBe(52 + 3 + 3);
    });

    it("large number of children handles correctly", () => {
      const n = 50;
      const assessments = Array.from({ length: n }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: true, relationship_quality_score: 4, social_confidence_score: 4, conflict_resolution_score: 4, empathy_score: 4, cooperation_score: 4, peer_acceptance_score: 4 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: n, peer_assessments: assessments }),
      );
      expect(r.total_assessments).toBe(n);
      expect(r.peer_assessment_coverage_rate).toBe(100);
    });

    it("bullying type pattern insight only fires with >= 3 incidents", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: [
            makeBullyingIncident({ id: "bi_1", incident_type: "verbal", resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
            makeBullyingIncident({ id: "bi_2", incident_type: "verbal", resolved: true, severity: "low", investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false, resolution_type: "informal", days_to_investigate: null, days_to_resolve: null }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.text.includes("Bullying incident patterns"))).toBe(false);
    });

    it("programme attendance pct(0,0) = 0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ active: false, sessions_planned: 0, sessions_attended: 0, measurable_improvement: false, child_engaged: false })],
        }),
      );
      expect(r.programme_attendance_rate).toBe(0);
    });

    it("friendship goal rate with 0 goals set returns 0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: false, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, activities_planned: 0, activities_completed: 0, external_friendships_supported: false, family_contact_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.friendship_goal_achievement_rate).toBe(0);
    });

    it("all-empty + total_children = 0 yields empty arrays", () => {
      const r = computePeerRelationshipSocialDevelopment(baseInput());
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── Additional Strengths (tier-2 branches) ─────────────────────────────

  describe("Strengths (tier-2 branches)", () => {
    it("includes programme attendance 70-89% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ active: true, sessions_planned: 10, sessions_attended: 7, measurable_improvement: false, child_engaged: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("programme session attendance"))).toBe(true);
    });

    it("includes social skills engagement 60-79% strength", () => {
      const programmes = Array.from({ length: 3 }, (_, i) =>
        makeSocialSkillsProgramme({ id: `ssp_${i}`, child_id: `child_${i + 1}`, active: true, sessions_planned: 10, sessions_attended: 5, measurable_improvement: false, child_engaged: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: programmes,
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("good levels of structured social development"))).toBe(true);
    });

    it("includes friendship plan coverage 60-79% strength", () => {
      const plans = Array.from({ length: 3 }, (_, i) =>
        makeFriendshipSupportPlan({ id: `fsp_${i}`, child_id: `child_${i + 1}`, active: true, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: plans,
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("good coverage of friendship support"))).toBe(true);
    });

    it("includes friendship goal achievement 60-79% strength", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ goals_set: 5, goals_achieved: 3, child_voice_in_plan: false, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("good progress towards social development"))).toBe(true);
    });

    it("includes bullying investigation 80-99% strength", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, severity: "low", resolved: true, investigated: i < 4, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("strong investigation practice"))).toBe(true);
    });

    it("includes bullying resolution 80-99% strength", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, severity: "low", resolved: i < 4, investigated: false, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("bullying resolution rate"))).toBe(true);
    });

    it("includes activity enjoyment 70-89% strength", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: i < 8, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("activities enjoyed"))).toBe(true);
    });

    it("includes social activity participation 70-89% strength", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 8 ? "attended" : "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("good levels of engagement in social activities"))).toBe(true);
    });
  });

  // ── Additional Concerns ────────────────────────────────────────────────

  describe("Concerns (additional branches)", () => {
    it("includes social confidence 2.5-2.9 concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ social_confidence_score: 3, relationship_quality_score: 2, child_voice_captured: false, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
            makePeerAssessment({ id: "pa_2", social_confidence_score: 2, relationship_quality_score: 2, child_voice_captured: false, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      // avg social confidence = (3+2)/2 = 2.5
      expect(r.concerns.some((c) => c.includes("Social confidence at") && c.includes("some children may benefit from additional support"))).toBe(true);
    });

    it("includes measurable improvement < 40% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [
            makeSocialSkillsProgramme({ id: "ssp_1", measurable_improvement: false, child_engaged: false, sessions_planned: 10, sessions_attended: 5 }),
            makeSocialSkillsProgramme({ id: "ssp_2", measurable_improvement: false, child_engaged: false, sessions_planned: 10, sessions_attended: 5 }),
            makeSocialSkillsProgramme({ id: "ssp_3", measurable_improvement: false, child_engaged: false, sessions_planned: 10, sessions_attended: 5 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("measurable improvement"))).toBe(true);
    });

    it("includes programme attendance < 50% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ sessions_planned: 10, sessions_attended: 4, measurable_improvement: false, child_engaged: false })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("programme session attendance"))).toBe(true);
    });

    it("includes programme attendance 50-69% concern", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ sessions_planned: 10, sessions_attended: 6, measurable_improvement: false, child_engaged: false })],
        }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("missing social skills sessions"))).toBe(true);
    });

    it("includes safety plan < 50% concern", () => {
      const incidents = Array.from({ length: 3 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, severity: "low", resolved: true, safety_plan_created: false, follow_up_completed: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.concerns.some((c) => c.includes("Safety plans created for only 0%"))).toBe(true);
    });

    it("includes bullying follow-up < 70% concern", () => {
      const incidents = Array.from({ length: 3 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, severity: "low", resolved: true, follow_up_completed: false, safety_plan_created: false, child_satisfied_with_outcome: false, parent_carer_informed: false, social_worker_informed: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.concerns.some((c) => c.includes("Bullying follow-up completed in only 0%"))).toBe(true);
    });

    it("includes activity enjoyment < 50% concern", () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("activities enjoyed"))).toBe(true);
    });

    it("includes peer interaction quality < 2.5 concern", () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", peer_interaction_quality: 2, child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.concerns.some((c) => c.includes("Peer interaction quality during activities averages only 2/5"))).toBe(true);
    });
  });

  // ── Additional Recommendations ─────────────────────────────────────────

  describe("Recommendations (additional branches)", () => {
    it("includes immediate recommendation for child voice < 50%", () => {
      // 1 assessment with no voice, 1 plan with no voice => combined = 0% < 50%
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("children's voices are captured"))).toBe(true);
    });

    it("includes soon recommendation for programme attendance < 70%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_skills_programmes: [makeSocialSkillsProgramme({ sessions_planned: 10, sessions_attended: 6, measurable_improvement: false, child_engaged: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("programme scheduling"))).toBe(true);
    });

    it("includes soon recommendation for friendship plan coverage < 60%", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ active: true, child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Develop friendship support plans"))).toBe(true);
    });

    it("includes planned recommendation for external activity < 30%", () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: "attended", external_activity: false, child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("external activity opportunities"))).toBe(true);
    });

    it("includes planned recommendation for conflict resolution < 3.0", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("conflict resolution skills training"))).toBe(true);
    });
  });

  // ── Additional Insights ────────────────────────────────────────────────

  describe("Insights (additional branches)", () => {
    it("critical insight for low participation rate", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 3 ? "attended" : "refused", child_enjoyed: false, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false, peer_interaction_quality: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("30%") && ins.text.includes("social activity participation"))).toBe(true);
    });

    it("critical insight for low child voice", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: [makeFriendshipSupportPlan({ child_voice_in_plan: false, goals_set: 0, goals_achieved: 0, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false })],
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Child voice captured in only 0%"))).toBe(true);
    });

    it("critical insight for no social activities with children", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No social activities recorded"))).toBe(true);
    });

    it("warning insight for peer assessment coverage 30-69%", () => {
      const assessments = Array.from({ length: 2 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 5, peer_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Peer assessment coverage at 40%"))).toBe(true);
    });

    it("positive insight for high coverage and quality", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makePeerAssessment({ id: `pa_${i}`, child_id: `child_${i + 1}`, child_voice_captured: true, relationship_quality_score: 5, social_confidence_score: 5, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 5 }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({ total_children: 10, peer_assessments: assessments }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Relationship quality") && ins.text.includes("social confidence"))).toBe(true);
    });

    it("positive insight for comprehensive bullying management", () => {
      const incidents = Array.from({ length: 3 }, (_, i) =>
        makeBullyingIncident({ id: `bi_${i}`, severity: "low", resolved: true, investigated: true, safety_plan_created: true, follow_up_completed: true }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          bullying_incidents: incidents,
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Bullying management is comprehensive"))).toBe(true);
    });

    it("positive insight for high participation and enjoyment", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        makeSocialActivityRecord({ id: `sar_${i}`, attendance_status: i < 9 ? "attended" : "refused", child_enjoyed: true, child_initiated: false, new_connections_made: false, group_activity: false, external_activity: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          social_activity_records: activities,
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("90%") && ins.text.includes("participation") && ins.text.includes("enjoyment"))).toBe(true);
    });

    it("positive insight for high friendship plan coverage and goal achievement", () => {
      const plans = Array.from({ length: 4 }, (_, i) =>
        makeFriendshipSupportPlan({ id: `fsp_${i}`, child_id: `child_${i + 1}`, active: true, goals_set: 5, goals_achieved: 4, child_voice_in_plan: false, external_friendships_supported: false, peer_matching_attempted: false, peer_matching_successful: false }),
      );
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 5,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 2, empathy_score: 2, cooperation_score: 2, peer_acceptance_score: 2 })],
          friendship_support_plans: plans,
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("80%") && ins.text.includes("friendship plan coverage") && ins.text.includes("goal achievement"))).toBe(true);
    });

    it("positive insight for prosocial skills (empathy + cooperation + conflict resolution)", () => {
      const r = computePeerRelationshipSocialDevelopment(
        baseInput({
          total_children: 3,
          peer_assessments: [makePeerAssessment({ child_voice_captured: false, relationship_quality_score: 2, social_confidence_score: 2, conflict_resolution_score: 5, empathy_score: 5, cooperation_score: 5, peer_acceptance_score: 2 })],
        }),
      );
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Empathy") && ins.text.includes("cooperation") && ins.text.includes("conflict resolution"))).toBe(true);
    });
  });
});
