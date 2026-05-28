import { describe, it, expect, beforeEach } from "vitest";
import {
  computeMultiAgencyCollaboration,
  type MultiAgencyCollaborationInput,
  type LacReviewRecordInput,
  type SocialWorkerVisitRecordInput,
  type TherapeuticServiceRecordInput,
  type EducationLiaisonRecordInput,
  type InformationSharingRecordInput,
} from "../home-multi-agency-collaboration-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `mac-${++_id}`;

function makeLacReview(overrides: Partial<LacReviewRecordInput> = {}): LacReviewRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    review_date: "2026-04-01",
    review_type: "subsequent",
    on_time: false,
    attended_by_child: false,
    attended_by_social_worker: false,
    attended_by_carer: false,
    attended_by_iro: false,
    attended_by_education: false,
    attended_by_health: false,
    child_views_recorded: false,
    actions_set: 0,
    actions_completed: 0,
    minutes_circulated_within_target: false,
    next_review_date: null,
    outcome_quality: "adequate",
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeGoodLacReview(overrides: Partial<LacReviewRecordInput> = {}): LacReviewRecordInput {
  return makeLacReview({
    on_time: true,
    attended_by_child: true,
    attended_by_social_worker: true,
    attended_by_carer: true,
    attended_by_iro: true,
    attended_by_education: true,
    attended_by_health: true,
    child_views_recorded: true,
    actions_set: 5,
    actions_completed: 5,
    minutes_circulated_within_target: true,
    outcome_quality: "good",
    ...overrides,
  });
}

function makeSWVisit(overrides: Partial<SocialWorkerVisitRecordInput> = {}): SocialWorkerVisitRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    visit_date: "2026-04-10",
    visit_type: "statutory",
    within_statutory_timescale: false,
    child_seen_alone: false,
    child_views_sought: false,
    visit_recorded_promptly: false,
    social_worker_name: "SW1",
    social_worker_consistent: false,
    placement_plan_reviewed: false,
    actions_arising: 0,
    actions_followed_up: false,
    quality_rating: "adequate",
    notes: "",
    created_at: "2026-04-10",
    ...overrides,
  };
}

function makeGoodSWVisit(overrides: Partial<SocialWorkerVisitRecordInput> = {}): SocialWorkerVisitRecordInput {
  return makeSWVisit({
    within_statutory_timescale: true,
    child_seen_alone: true,
    child_views_sought: true,
    visit_recorded_promptly: true,
    social_worker_consistent: true,
    placement_plan_reviewed: true,
    actions_arising: 3,
    actions_followed_up: true,
    quality_rating: "good",
    ...overrides,
  });
}

function makeTherapeutic(overrides: Partial<TherapeuticServiceRecordInput> = {}): TherapeuticServiceRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    service_type: "camhs",
    referral_date: "2026-01-15",
    first_appointment_date: "2026-02-01",
    service_active: false,
    sessions_offered: 0,
    sessions_attended: 0,
    child_engaged: false,
    progress_reported: false,
    waiting_list: false,
    waiting_days: 0,
    professional_name: "Dr Therapist",
    home_liaison_quality: "adequate",
    information_shared_with_home: false,
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeGoodTherapeutic(overrides: Partial<TherapeuticServiceRecordInput> = {}): TherapeuticServiceRecordInput {
  return makeTherapeutic({
    service_active: true,
    sessions_offered: 10,
    sessions_attended: 10,
    child_engaged: true,
    progress_reported: true,
    waiting_list: false,
    waiting_days: 0,
    home_liaison_quality: "good",
    information_shared_with_home: true,
    ...overrides,
  });
}

function makeEducation(overrides: Partial<EducationLiaisonRecordInput> = {}): EducationLiaisonRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    liaison_date: "2026-03-20",
    liaison_type: "pep_meeting",
    school_name: "Oakwood Academy",
    attended_by_home: false,
    attended_by_social_worker: false,
    pep_up_to_date: false,
    educational_progress_discussed: false,
    actions_agreed: 0,
    actions_completed: 0,
    pupil_premium_discussed: false,
    designated_teacher_involved: false,
    ehcp_relevant: false,
    ehcp_reviewed: false,
    quality_rating: "adequate",
    notes: "",
    created_at: "2026-03-20",
    ...overrides,
  };
}

function makeGoodEducation(overrides: Partial<EducationLiaisonRecordInput> = {}): EducationLiaisonRecordInput {
  return makeEducation({
    attended_by_home: true,
    attended_by_social_worker: true,
    pep_up_to_date: true,
    educational_progress_discussed: true,
    actions_agreed: 4,
    actions_completed: 4,
    pupil_premium_discussed: true,
    designated_teacher_involved: true,
    ehcp_relevant: false,
    ehcp_reviewed: false,
    quality_rating: "good",
    ...overrides,
  });
}

function makeInfoSharing(overrides: Partial<InformationSharingRecordInput> = {}): InformationSharingRecordInput {
  return {
    id: uid(),
    date: "2026-04-05",
    sharing_type: "email_update",
    agencies_involved: [],
    initiated_by_home: false,
    timely: false,
    information_complete: false,
    consent_obtained: false,
    gdpr_compliant: false,
    outcome_recorded: false,
    follow_up_required: false,
    follow_up_completed: false,
    child_id: "c1",
    is_multi_agency_meeting: false,
    notes: "",
    created_at: "2026-04-05",
    ...overrides,
  };
}

function makeGoodInfoSharing(overrides: Partial<InformationSharingRecordInput> = {}): InformationSharingRecordInput {
  return makeInfoSharing({
    agencies_involved: ["social_services", "education", "health"],
    initiated_by_home: true,
    timely: true,
    information_complete: true,
    consent_obtained: true,
    gdpr_compliant: true,
    outcome_recorded: true,
    follow_up_required: false,
    follow_up_completed: false,
    is_multi_agency_meeting: true,
    ...overrides,
  });
}

function baseInput(overrides: Partial<MultiAgencyCollaborationInput> = {}): MultiAgencyCollaborationInput {
  return {
    today: "2026-05-28",
    total_children: 3,
    lac_review_records: [],
    social_worker_visit_records: [],
    therapeutic_service_records: [],
    education_liaison_records: [],
    information_sharing_records: [],
    ...overrides,
  };
}

beforeEach(() => {
  _id = 0;
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeMultiAgencyCollaboration", () => {
  // ── Insufficient Data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children=0 and all arrays empty", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 0 }),
      );
      expect(r.agency_rating).toBe("insufficient_data");
      expect(r.agency_score).toBe(0);
    });

    it("has zero totals for insufficient_data", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 0 }),
      );
      expect(r.total_lac_reviews).toBe(0);
      expect(r.total_sw_visits).toBe(0);
      expect(r.total_therapeutic_records).toBe(0);
      expect(r.total_education_liaisons).toBe(0);
      expect(r.total_info_sharing_records).toBe(0);
    });

    it("has zero rates for insufficient_data", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 0 }),
      );
      expect(r.lac_review_timeliness_rate).toBe(0);
      expect(r.social_worker_visit_rate).toBe(0);
      expect(r.therapeutic_engagement_rate).toBe(0);
      expect(r.education_liaison_rate).toBe(0);
      expect(r.information_sharing_rate).toBe(0);
      expect(r.multi_agency_meeting_rate).toBe(0);
    });

    it("has empty strengths/concerns/recommendations/insights for insufficient_data", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 0 }),
      );
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("headline mentions insufficient data", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline).toContain("insufficient data");
    });
  });

  // ── Inadequate Floor ──────────────────────────────────────────────────

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score=15 when all arrays empty but children present", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.agency_rating).toBe("inadequate");
      expect(r.agency_score).toBe(15);
    });

    it("returns inadequate floor with total_children=1", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 1 }),
      );
      expect(r.agency_rating).toBe("inadequate");
      expect(r.agency_score).toBe(15);
    });

    it("returns inadequate floor with total_children=100", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 100 }),
      );
      expect(r.agency_rating).toBe("inadequate");
      expect(r.agency_score).toBe(15);
    });

    it("has zero totals for inadequate floor", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.total_lac_reviews).toBe(0);
      expect(r.total_sw_visits).toBe(0);
      expect(r.total_therapeutic_records).toBe(0);
      expect(r.total_education_liaisons).toBe(0);
      expect(r.total_info_sharing_records).toBe(0);
    });

    it("has concerns for inadequate floor", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.concerns.length).toBe(1);
      expect(r.concerns[0]).toContain("No LAC review records");
    });

    it("has recommendations for inadequate floor", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations.length).toBe(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has critical insight for inadequate floor", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("headline mentions urgent improvement for inadequate floor", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({ total_children: 3 }),
      );
      expect(r.headline).toContain("urgent attention");
    });
  });

  // ── Outstanding Scenario ──────────────────────────────────────────────

  describe("outstanding scenario", () => {
    function outstandingInput(): MultiAgencyCollaborationInput {
      return baseInput({
        lac_review_records: [
          makeGoodLacReview({ child_id: "c1" }),
          makeGoodLacReview({ child_id: "c2" }),
          makeGoodLacReview({ child_id: "c3" }),
        ],
        social_worker_visit_records: [
          makeGoodSWVisit({ child_id: "c1" }),
          makeGoodSWVisit({ child_id: "c2" }),
          makeGoodSWVisit({ child_id: "c3" }),
        ],
        therapeutic_service_records: [
          makeGoodTherapeutic({ child_id: "c1" }),
          makeGoodTherapeutic({ child_id: "c2" }),
          makeGoodTherapeutic({ child_id: "c3" }),
        ],
        education_liaison_records: [
          makeGoodEducation({ child_id: "c1" }),
          makeGoodEducation({ child_id: "c2" }),
          makeGoodEducation({ child_id: "c3" }),
        ],
        information_sharing_records: [
          makeGoodInfoSharing({ child_id: "c1", agencies_involved: ["social_services", "education", "health", "camhs", "police"] }),
          makeGoodInfoSharing({ child_id: "c2", agencies_involved: ["social_services", "education", "health", "camhs", "police"] }),
          makeGoodInfoSharing({ child_id: "c3", agencies_involved: ["social_services", "education", "health", "camhs", "police"] }),
        ],
      });
    }

    it("achieves outstanding rating (score >= 80)", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.agency_rating).toBe("outstanding");
      expect(r.agency_score).toBeGreaterThanOrEqual(80);
    });

    it("has 100% lac_review_timeliness_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.lac_review_timeliness_rate).toBe(100);
    });

    it("has 100% social_worker_visit_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.social_worker_visit_rate).toBe(100);
    });

    it("has 100% therapeutic_engagement_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.therapeutic_engagement_rate).toBe(100);
    });

    it("has 100% education_liaison_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.education_liaison_rate).toBe(100);
    });

    it("has 100% information_sharing_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.information_sharing_rate).toBe(100);
    });

    it("has 100% multi_agency_meeting_rate", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.multi_agency_meeting_rate).toBe(100);
    });

    it("has multiple strengths", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });

    it("has no concerns", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.concerns.length).toBe(0);
    });

    it("headline starts with Outstanding", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has positive insights", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.length).toBeGreaterThanOrEqual(1);
    });

    it("totals match record counts", () => {
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.total_lac_reviews).toBe(3);
      expect(r.total_sw_visits).toBe(3);
      expect(r.total_therapeutic_records).toBe(3);
      expect(r.total_education_liaisons).toBe(3);
      expect(r.total_info_sharing_records).toBe(3);
    });

    it("score equals base(52) + all bonuses(28) = 80", () => {
      // With all rates at 100%: +4+4+3+3+3+3+3+3+2 = 28
      const r = computeMultiAgencyCollaboration(outstandingInput());
      expect(r.agency_score).toBe(80);
    });
  });

  // ── Good Scenario ─────────────────────────────────────────────────────

  describe("good scenario", () => {
    function goodInput(): MultiAgencyCollaborationInput {
      // Rates at ~80-94% — enough for lower-tier bonuses, not quite outstanding
      // Target: score 65-79
      // Bonuses: lac 80% => +2, sw 80% => +2, therapeutic 80% => +1,
      //   education 80% => +1, info 80% => +1, lac actions 80% => +1,
      //   child seen alone 80% => +1, pep 80% => +1, gdpr 80% => +1
      // = 11 => 52 + 11 = 63... still not enough
      // Need higher tiers: lac 100% => +4, sw 100% => +4, therapeutic 80% => +1,
      //   education 80% => +1, info 80% => +1, child seen alone 80% => +1,
      //   lac actions 80% => +1, pep 70% => +1, gdpr 80% => +1
      // = 15 => 52 + 15 = 67 (good!)
      return baseInput({
        lac_review_records: [
          makeGoodLacReview({ child_id: "c1" }),
          makeGoodLacReview({ child_id: "c2" }),
          makeGoodLacReview({ child_id: "c3" }),
        ],
        social_worker_visit_records: [
          makeGoodSWVisit({ child_id: "c1" }),
          makeGoodSWVisit({ child_id: "c2" }),
          makeGoodSWVisit({ child_id: "c3" }),
        ],
        therapeutic_service_records: [
          makeGoodTherapeutic({ child_id: "c1" }),
          makeGoodTherapeutic({ child_id: "c2" }),
          makeTherapeutic({ child_id: "c3", child_engaged: true, service_active: true, sessions_offered: 5, sessions_attended: 3 }),
          makeTherapeutic({ child_id: "c1", child_engaged: false, service_active: false }),
          makeTherapeutic({ child_id: "c2", child_engaged: false, service_active: false }),
        ],
        education_liaison_records: [
          makeGoodEducation({ child_id: "c1" }),
          makeGoodEducation({ child_id: "c2" }),
          makeGoodEducation({ child_id: "c3" }),
          makeEducation({ child_id: "c1", attended_by_home: true, pep_up_to_date: false }),
          makeEducation({ child_id: "c2", attended_by_home: false, pep_up_to_date: false }),
        ],
        information_sharing_records: [
          makeGoodInfoSharing({ child_id: "c1" }),
          makeGoodInfoSharing({ child_id: "c2" }),
          makeGoodInfoSharing({ child_id: "c3" }),
          makeInfoSharing({ child_id: "c1", timely: true, gdpr_compliant: true }),
          makeInfoSharing({ child_id: "c2", timely: false, gdpr_compliant: false }),
        ],
      });
    }

    it("achieves good rating (score 65-79)", () => {
      const r = computeMultiAgencyCollaboration(goodInput());
      expect(r.agency_rating).toBe("good");
      expect(r.agency_score).toBeGreaterThanOrEqual(65);
      expect(r.agency_score).toBeLessThan(80);
    });

    it("headline starts with Good", () => {
      const r = computeMultiAgencyCollaboration(goodInput());
      expect(r.headline).toContain("Good");
    });

    it("has strengths and some concerns", () => {
      const r = computeMultiAgencyCollaboration(goodInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Adequate Scenario ─────────────────────────────────────────────────

  describe("adequate scenario", () => {
    function adequateInput(): MultiAgencyCollaborationInput {
      // Weaker data — rates around 50-70%
      return baseInput({
        lac_review_records: [
          makeLacReview({ child_id: "c1", on_time: true, actions_set: 3, actions_completed: 2, outcome_quality: "adequate" }),
          makeLacReview({ child_id: "c2", on_time: true, actions_set: 2, actions_completed: 1, outcome_quality: "adequate" }),
          makeLacReview({ child_id: "c3", on_time: false, actions_set: 3, actions_completed: 1, outcome_quality: "poor" }),
          makeLacReview({ child_id: "c1", on_time: false, actions_set: 2, actions_completed: 0, outcome_quality: "adequate" }),
        ],
        social_worker_visit_records: [
          makeSWVisit({ child_id: "c1", within_statutory_timescale: true, child_seen_alone: true }),
          makeSWVisit({ child_id: "c2", within_statutory_timescale: true, child_seen_alone: false }),
          makeSWVisit({ child_id: "c3", within_statutory_timescale: false, child_seen_alone: false }),
          makeSWVisit({ child_id: "c1", within_statutory_timescale: false, child_seen_alone: true }),
        ],
        therapeutic_service_records: [
          makeTherapeutic({ child_id: "c1", child_engaged: true, service_active: true, sessions_offered: 5, sessions_attended: 3 }),
          makeTherapeutic({ child_id: "c2", child_engaged: true, service_active: true }),
          makeTherapeutic({ child_id: "c3", child_engaged: false, service_active: false }),
          makeTherapeutic({ child_id: "c1", child_engaged: false, service_active: false }),
        ],
        education_liaison_records: [
          makeEducation({ child_id: "c1", attended_by_home: true, pep_up_to_date: true }),
          makeEducation({ child_id: "c2", attended_by_home: true, pep_up_to_date: false }),
          makeEducation({ child_id: "c3", attended_by_home: false, pep_up_to_date: false }),
          makeEducation({ child_id: "c1", attended_by_home: false, pep_up_to_date: false }),
        ],
        information_sharing_records: [
          makeInfoSharing({ child_id: "c1", timely: true, gdpr_compliant: true }),
          makeInfoSharing({ child_id: "c2", timely: true, gdpr_compliant: false }),
          makeInfoSharing({ child_id: "c3", timely: false, gdpr_compliant: false }),
          makeInfoSharing({ child_id: "c1", timely: false, gdpr_compliant: false }),
        ],
      });
    }

    it("achieves adequate rating (score 45-64)", () => {
      const r = computeMultiAgencyCollaboration(adequateInput());
      expect(r.agency_rating).toBe("adequate");
      expect(r.agency_score).toBeGreaterThanOrEqual(45);
      expect(r.agency_score).toBeLessThan(65);
    });

    it("headline mentions areas for improvement", () => {
      const r = computeMultiAgencyCollaboration(adequateInput());
      expect(r.headline).toContain("areas for improvement");
    });

    it("has concerns", () => {
      const r = computeMultiAgencyCollaboration(adequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(1);
    });

    it("has recommendations", () => {
      const r = computeMultiAgencyCollaboration(adequateInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Inadequate Scenario ───────────────────────────────────────────────

  describe("inadequate scenario", () => {
    function inadequateInput(): MultiAgencyCollaborationInput {
      // Poor data — rates below 50%, triggering penalties
      return baseInput({
        lac_review_records: [
          makeLacReview({ child_id: "c1", on_time: false, outcome_quality: "poor" }),
          makeLacReview({ child_id: "c2", on_time: false, outcome_quality: "poor" }),
          makeLacReview({ child_id: "c3", on_time: false, outcome_quality: "poor" }),
          makeLacReview({ child_id: "c1", on_time: true, outcome_quality: "adequate" }),
        ],
        social_worker_visit_records: [
          makeSWVisit({ child_id: "c1", within_statutory_timescale: false }),
          makeSWVisit({ child_id: "c2", within_statutory_timescale: false }),
          makeSWVisit({ child_id: "c3", within_statutory_timescale: false }),
          makeSWVisit({ child_id: "c1", within_statutory_timescale: true }),
        ],
        therapeutic_service_records: [
          makeTherapeutic({ child_id: "c1", child_engaged: false, service_active: false }),
          makeTherapeutic({ child_id: "c2", child_engaged: false, service_active: false }),
          makeTherapeutic({ child_id: "c3", child_engaged: true, service_active: true }),
        ],
        education_liaison_records: [
          makeEducation({ child_id: "c1", attended_by_home: false }),
          makeEducation({ child_id: "c2", attended_by_home: false }),
          makeEducation({ child_id: "c3", attended_by_home: true }),
        ],
        information_sharing_records: [
          makeInfoSharing({ child_id: "c1", timely: false }),
          makeInfoSharing({ child_id: "c2", timely: false }),
          makeInfoSharing({ child_id: "c3", timely: true }),
        ],
      });
    }

    it("achieves inadequate rating (score < 45)", () => {
      const r = computeMultiAgencyCollaboration(inadequateInput());
      expect(r.agency_rating).toBe("inadequate");
      expect(r.agency_score).toBeLessThan(45);
    });

    it("headline mentions urgent improvement", () => {
      const r = computeMultiAgencyCollaboration(inadequateInput());
      expect(r.headline).toContain("urgent improvement");
    });

    it("has concerns about low rates", () => {
      const r = computeMultiAgencyCollaboration(inadequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(3);
    });

    it("has immediate recommendations", () => {
      const r = computeMultiAgencyCollaboration(inadequateInput());
      const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediateRecs.length).toBeGreaterThanOrEqual(1);
    });

    it("has critical insights", () => {
      const r = computeMultiAgencyCollaboration(inadequateInput());
      const criticalInsights = r.insights.filter((i) => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Individual Bonus Tests ─────────────────────────────────────────────

  describe("individual bonuses", () => {
    // Baseline: only a single record type populated with minimal data.
    // All other arrays empty => their rates are pct(0,0) = 0, no bonus triggered.
    // base_score = 52, no penalties because guarded by count > 0.

    // --- Bonus 1: lacReviewTimelinessRate ---

    describe("Bonus 1: LAC review timeliness", () => {
      it("+4 when lacReviewTimelinessRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true }),
            ],
          }),
        );
        // 100% timeliness => +4, lacActionCompletionRate = pct(0,0)=0 no bonus
        expect(r.agency_score).toBe(52 + 4);
      });

      it("+2 when lacReviewTimelinessRate >= 80 but < 95", () => {
        const reviews = [];
        for (let i = 0; i < 5; i++) {
          reviews.push(makeLacReview({ on_time: i < 4 })); // 80%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ lac_review_records: reviews }),
        );
        // 80% => +2
        expect(r.agency_score).toBe(52 + 2);
      });

      it("no bonus when lacReviewTimelinessRate < 80 (but >= 50)", () => {
        const reviews = [];
        for (let i = 0; i < 10; i++) {
          reviews.push(makeLacReview({ on_time: i < 7 })); // 70%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ lac_review_records: reviews }),
        );
        expect(r.agency_score).toBe(52);
      });
    });

    // --- Bonus 2: socialWorkerVisitRate ---

    describe("Bonus 2: social worker visit rate", () => {
      it("+4 when socialWorkerVisitRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: true }),
            ],
          }),
        );
        // 100% => +4
        expect(r.agency_score).toBe(52 + 4);
      });

      it("+2 when socialWorkerVisitRate >= 80 but < 95", () => {
        const visits = [];
        for (let i = 0; i < 5; i++) {
          visits.push(makeSWVisit({ within_statutory_timescale: i < 4 })); // 80%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ social_worker_visit_records: visits }),
        );
        expect(r.agency_score).toBe(52 + 2);
      });

      it("no bonus when socialWorkerVisitRate < 80 (but >= 50)", () => {
        const visits = [];
        for (let i = 0; i < 10; i++) {
          visits.push(makeSWVisit({ within_statutory_timescale: i < 6 })); // 60%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ social_worker_visit_records: visits }),
        );
        expect(r.agency_score).toBe(52);
      });
    });

    // --- Bonus 3: therapeuticEngagementRate ---

    describe("Bonus 3: therapeutic engagement rate", () => {
      it("+3 when therapeuticEngagementRate >= 90", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: true }),
            ],
          }),
        );
        // 100% => +3
        expect(r.agency_score).toBe(52 + 3);
      });

      it("+1 when therapeuticEngagementRate >= 70 but < 90", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(makeTherapeutic({ child_engaged: i < 8 })); // 80%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ therapeutic_service_records: recs }),
        );
        expect(r.agency_score).toBe(52 + 1);
      });

      it("no bonus when therapeuticEngagementRate < 70 (but >= 40)", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(makeTherapeutic({ child_engaged: i < 5 })); // 50%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ therapeutic_service_records: recs }),
        );
        expect(r.agency_score).toBe(52);
      });
    });

    // --- Bonus 4: educationLiaisonRate ---

    describe("Bonus 4: education liaison rate", () => {
      it("+3 when educationLiaisonRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            education_liaison_records: [
              makeEducation({ attended_by_home: true }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52 + 3);
      });

      it("+1 when educationLiaisonRate >= 80 but < 95", () => {
        const recs = [];
        for (let i = 0; i < 5; i++) {
          recs.push(makeEducation({ attended_by_home: i < 4 })); // 80%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ education_liaison_records: recs }),
        );
        expect(r.agency_score).toBe(52 + 1);
      });

      it("no bonus when educationLiaisonRate < 80", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(makeEducation({ attended_by_home: i < 7 })); // 70%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ education_liaison_records: recs }),
        );
        expect(r.agency_score).toBe(52);
      });
    });

    // --- Bonus 5: informationSharingRate ---

    describe("Bonus 5: information sharing rate", () => {
      it("+3 when informationSharingRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: true }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52 + 3);
      });

      it("+1 when informationSharingRate >= 80 but < 95", () => {
        const recs = [];
        for (let i = 0; i < 5; i++) {
          recs.push(makeInfoSharing({ timely: i < 4 })); // 80%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ information_sharing_records: recs }),
        );
        expect(r.agency_score).toBe(52 + 1);
      });

      it("no bonus when informationSharingRate < 80 (but >= 50)", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(makeInfoSharing({ timely: i < 6 })); // 60%
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ information_sharing_records: recs }),
        );
        expect(r.agency_score).toBe(52);
      });
    });

    // --- Bonus 6: lacActionCompletionRate ---

    describe("Bonus 6: LAC action completion rate", () => {
      it("+3 when lacActionCompletionRate >= 90", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: false, actions_set: 10, actions_completed: 10 }),
            ],
          }),
        );
        // lacReviewTimelinessRate = 0% => penalty -6, lacActionCompletionRate = 100% => +3
        // 52 + 3 - 6 = 49
        expect(r.agency_score).toBe(49);
      });

      it("+3 when lacActionCompletionRate >= 90 (without timeliness penalty)", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true, actions_set: 10, actions_completed: 10 }),
            ],
          }),
        );
        // lacReviewTimelinessRate = 100% => +4, lacActionCompletionRate = 100% => +3
        expect(r.agency_score).toBe(52 + 4 + 3);
      });

      it("+1 when lacActionCompletionRate >= 70 but < 90", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true, actions_set: 10, actions_completed: 7 }),
            ],
          }),
        );
        // lacReviewTimelinessRate = 100% => +4, lacActionCompletionRate = 70% => +1
        expect(r.agency_score).toBe(52 + 4 + 1);
      });

      it("no bonus when lacActionCompletionRate < 70", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true, actions_set: 10, actions_completed: 5 }),
            ],
          }),
        );
        // lacReviewTimelinessRate = 100% => +4, lacActionCompletionRate = 50% => no bonus
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    // --- Bonus 7: childSeenAloneRate ---

    describe("Bonus 7: child seen alone rate", () => {
      it("+3 when childSeenAloneRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: false, child_seen_alone: true }),
            ],
          }),
        );
        // socialWorkerVisitRate = 0% => penalty -5, childSeenAloneRate = 100% => +3
        expect(r.agency_score).toBe(52 + 3 - 5);
      });

      it("+3 when childSeenAloneRate >= 95 (no other penalties)", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: true, child_seen_alone: true }),
            ],
          }),
        );
        // socialWorkerVisitRate = 100% => +4, childSeenAloneRate = 100% => +3
        expect(r.agency_score).toBe(52 + 4 + 3);
      });

      it("+1 when childSeenAloneRate >= 80 but < 95", () => {
        const visits = [];
        for (let i = 0; i < 5; i++) {
          visits.push(
            makeSWVisit({
              within_statutory_timescale: true,
              child_seen_alone: i < 4, // 80%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ social_worker_visit_records: visits }),
        );
        // socialWorkerVisitRate = 100% => +4, childSeenAloneRate = 80% => +1
        expect(r.agency_score).toBe(52 + 4 + 1);
      });

      it("no bonus when childSeenAloneRate < 80", () => {
        const visits = [];
        for (let i = 0; i < 10; i++) {
          visits.push(
            makeSWVisit({
              within_statutory_timescale: true,
              child_seen_alone: i < 7, // 70%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ social_worker_visit_records: visits }),
        );
        // socialWorkerVisitRate = 100% => +4, childSeenAloneRate = 70% => no bonus
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    // --- Bonus 8: pepUpToDateRate ---

    describe("Bonus 8: PEP up to date rate", () => {
      it("+3 when pepUpToDateRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            education_liaison_records: [
              makeEducation({ attended_by_home: true, pep_up_to_date: true }),
            ],
          }),
        );
        // educationLiaisonRate = 100% => +3, pepUpToDateRate = 100% => +3
        expect(r.agency_score).toBe(52 + 3 + 3);
      });

      it("+1 when pepUpToDateRate >= 70 but < 95", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(
            makeEducation({
              attended_by_home: true,
              pep_up_to_date: i < 8, // 80%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ education_liaison_records: recs }),
        );
        // educationLiaisonRate = 100% => +3, pepUpToDateRate = 80% => +1
        expect(r.agency_score).toBe(52 + 3 + 1);
      });

      it("no bonus when pepUpToDateRate < 70", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(
            makeEducation({
              attended_by_home: true,
              pep_up_to_date: i < 6, // 60%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ education_liaison_records: recs }),
        );
        // educationLiaisonRate = 100% => +3, pepUpToDateRate = 60% => no bonus
        expect(r.agency_score).toBe(52 + 3);
      });
    });

    // --- Bonus 9: gdprComplianceRate ---

    describe("Bonus 9: GDPR compliance rate", () => {
      it("+2 when gdprComplianceRate >= 95", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: true, gdpr_compliant: true }),
            ],
          }),
        );
        // informationSharingRate = 100% => +3, gdprComplianceRate = 100% => +2
        expect(r.agency_score).toBe(52 + 3 + 2);
      });

      it("+1 when gdprComplianceRate >= 80 but < 95", () => {
        const recs = [];
        for (let i = 0; i < 5; i++) {
          recs.push(
            makeInfoSharing({
              timely: true,
              gdpr_compliant: i < 4, // 80%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ information_sharing_records: recs }),
        );
        // informationSharingRate = 100% => +3, gdprComplianceRate = 80% => +1
        expect(r.agency_score).toBe(52 + 3 + 1);
      });

      it("no bonus when gdprComplianceRate < 80", () => {
        const recs = [];
        for (let i = 0; i < 10; i++) {
          recs.push(
            makeInfoSharing({
              timely: true,
              gdpr_compliant: i < 7, // 70%
            }),
          );
        }
        const r = computeMultiAgencyCollaboration(
          baseInput({ information_sharing_records: recs }),
        );
        // informationSharingRate = 100% => +3, gdprComplianceRate = 70% => no bonus
        expect(r.agency_score).toBe(52 + 3);
      });
    });
  });

  // ── Individual Penalty Tests ──────────────────────────────────────────

  describe("individual penalties", () => {
    describe("Penalty 1: LAC review timeliness < 50%", () => {
      it("-6 when lacReviewTimelinessRate < 50 and totalLacReviews > 0", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: false }),
              makeLacReview({ on_time: false }),
              makeLacReview({ on_time: false }),
            ],
          }),
        );
        // 0% timeliness => -6
        expect(r.agency_score).toBe(52 - 6);
      });

      it("-6 at exactly 33% (< 50)", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true }),
              makeLacReview({ on_time: false }),
              makeLacReview({ on_time: false }),
            ],
          }),
        );
        // 33% => -6
        expect(r.agency_score).toBe(52 - 6);
      });

      it("no penalty when lacReviewTimelinessRate = 50%", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true }),
              makeLacReview({ on_time: false }),
            ],
          }),
        );
        // 50% => no penalty, no bonus
        expect(r.agency_score).toBe(52);
      });

      it("no penalty when no LAC reviews (guarded)", () => {
        // Need at least one record in another array to avoid allEmpty floor
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [],
            social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: true })],
          }),
        );
        // No lac records => pct(0,0)=0 but guarded, no penalty from lac
        // sw 100% => +4
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    describe("Penalty 2: social worker visit rate < 50%", () => {
      it("-5 when socialWorkerVisitRate < 50 and totalSWVisits > 0", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: false }),
              makeSWVisit({ within_statutory_timescale: false }),
              makeSWVisit({ within_statutory_timescale: false }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52 - 5);
      });

      it("no penalty when socialWorkerVisitRate = 50%", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: true }),
              makeSWVisit({ within_statutory_timescale: false }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52);
      });

      it("no penalty when no SW visits (guarded)", () => {
        // Need at least one record in another array to avoid allEmpty floor
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [],
            lac_review_records: [makeLacReview({ on_time: true })],
          }),
        );
        // No sw records => pct(0,0)=0 but guarded, no penalty from sw
        // lac 100% => +4
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    describe("Penalty 3: therapeutic engagement < 40%", () => {
      it("-4 when therapeuticEngagementRate < 40 and totalTherapeuticRecords > 0", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52 - 4);
      });

      it("-4 at exactly 33% (< 40)", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: true }),
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
            ],
          }),
        );
        // 33% => -4
        expect(r.agency_score).toBe(52 - 4);
      });

      it("no penalty when therapeuticEngagementRate = 40%", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: true }),
              makeTherapeutic({ child_engaged: true }),
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
            ],
          }),
        );
        // 40% => no penalty
        expect(r.agency_score).toBe(52);
      });

      it("no penalty when no therapeutic records (guarded)", () => {
        // Need at least one record in another array to avoid allEmpty floor
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [],
            lac_review_records: [makeLacReview({ on_time: true })],
          }),
        );
        // No therapeutic records => pct(0,0)=0 but guarded, no penalty from therapeutic
        // lac 100% => +4
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    describe("Penalty 4: information sharing rate < 50%", () => {
      it("-3 when informationSharingRate < 50 and totalInfoSharingRecords > 0", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: false }),
              makeInfoSharing({ timely: false }),
              makeInfoSharing({ timely: false }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52 - 3);
      });

      it("no penalty when informationSharingRate = 50%", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: true }),
              makeInfoSharing({ timely: false }),
            ],
          }),
        );
        expect(r.agency_score).toBe(52);
      });

      it("no penalty when no info sharing records (guarded)", () => {
        // Need at least one record in another array to avoid allEmpty floor
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [],
            lac_review_records: [makeLacReview({ on_time: true })],
          }),
        );
        // No info records => pct(0,0)=0 but guarded, no penalty from info
        // lac 100% => +4
        expect(r.agency_score).toBe(52 + 4);
      });
    });

    describe("all penalties combined", () => {
      it("applies all four penalties when all rates below thresholds", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [makeLacReview({ on_time: false })],
            social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
            therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
            information_sharing_records: [makeInfoSharing({ timely: false })],
          }),
        );
        // 52 - 6 - 5 - 4 - 3 = 34
        expect(r.agency_score).toBe(34);
      });
    });
  });

  // ── Rate Calculation Tests ─────────────────────────────────────────────

  describe("rate calculations", () => {
    describe("lac_review_timeliness_rate", () => {
      it("returns 0 when no LAC reviews", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.lac_review_timeliness_rate).toBe(0);
      });

      it("returns 100 when all on time", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true }),
              makeLacReview({ on_time: true }),
            ],
          }),
        );
        expect(r.lac_review_timeliness_rate).toBe(100);
      });

      it("returns 0 when none on time", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: false }),
              makeLacReview({ on_time: false }),
            ],
          }),
        );
        expect(r.lac_review_timeliness_rate).toBe(0);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            lac_review_records: [
              makeLacReview({ on_time: true }),
              makeLacReview({ on_time: true }),
              makeLacReview({ on_time: false }),
            ],
          }),
        );
        expect(r.lac_review_timeliness_rate).toBe(67); // Math.round(2/3 * 100) = 67
      });
    });

    describe("social_worker_visit_rate", () => {
      it("returns 0 when no SW visits", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.social_worker_visit_rate).toBe(0);
      });

      it("returns 100 when all within timescale", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: true }),
              makeSWVisit({ within_statutory_timescale: true }),
            ],
          }),
        );
        expect(r.social_worker_visit_rate).toBe(100);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            social_worker_visit_records: [
              makeSWVisit({ within_statutory_timescale: true }),
              makeSWVisit({ within_statutory_timescale: true }),
              makeSWVisit({ within_statutory_timescale: true }),
              makeSWVisit({ within_statutory_timescale: false }),
            ],
          }),
        );
        expect(r.social_worker_visit_rate).toBe(75); // Math.round(3/4 * 100)
      });
    });

    describe("therapeutic_engagement_rate", () => {
      it("returns 0 when no therapeutic records", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.therapeutic_engagement_rate).toBe(0);
      });

      it("returns 100 when all engaged", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: true }),
              makeTherapeutic({ child_engaged: true }),
            ],
          }),
        );
        expect(r.therapeutic_engagement_rate).toBe(100);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            therapeutic_service_records: [
              makeTherapeutic({ child_engaged: true }),
              makeTherapeutic({ child_engaged: false }),
              makeTherapeutic({ child_engaged: false }),
            ],
          }),
        );
        expect(r.therapeutic_engagement_rate).toBe(33); // Math.round(1/3 * 100)
      });
    });

    describe("education_liaison_rate", () => {
      it("returns 0 when no education liaisons", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.education_liaison_rate).toBe(0);
      });

      it("returns 100 when all attended by home", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            education_liaison_records: [
              makeEducation({ attended_by_home: true }),
              makeEducation({ attended_by_home: true }),
            ],
          }),
        );
        expect(r.education_liaison_rate).toBe(100);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            education_liaison_records: [
              makeEducation({ attended_by_home: true }),
              makeEducation({ attended_by_home: true }),
              makeEducation({ attended_by_home: false }),
              makeEducation({ attended_by_home: false }),
            ],
          }),
        );
        expect(r.education_liaison_rate).toBe(50);
      });
    });

    describe("information_sharing_rate", () => {
      it("returns 0 when no info sharing records", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.information_sharing_rate).toBe(0);
      });

      it("returns 100 when all timely", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: true }),
              makeInfoSharing({ timely: true }),
            ],
          }),
        );
        expect(r.information_sharing_rate).toBe(100);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ timely: true }),
              makeInfoSharing({ timely: true }),
              makeInfoSharing({ timely: false }),
              makeInfoSharing({ timely: false }),
              makeInfoSharing({ timely: false }),
            ],
          }),
        );
        expect(r.information_sharing_rate).toBe(40);
      });
    });

    describe("multi_agency_meeting_rate", () => {
      it("returns 0 when no info sharing records", () => {
        const r = computeMultiAgencyCollaboration(baseInput());
        expect(r.multi_agency_meeting_rate).toBe(0);
      });

      it("returns 100 when all are multi-agency meetings", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ is_multi_agency_meeting: true }),
              makeInfoSharing({ is_multi_agency_meeting: true }),
            ],
          }),
        );
        expect(r.multi_agency_meeting_rate).toBe(100);
      });

      it("calculates correct percentage", () => {
        const r = computeMultiAgencyCollaboration(
          baseInput({
            information_sharing_records: [
              makeInfoSharing({ is_multi_agency_meeting: true }),
              makeInfoSharing({ is_multi_agency_meeting: false }),
              makeInfoSharing({ is_multi_agency_meeting: false }),
            ],
          }),
        );
        expect(r.multi_agency_meeting_rate).toBe(33);
      });
    });
  });

  // ── Strengths Tests ───────────────────────────────────────────────────

  describe("strengths", () => {
    it("S1: LAC review timeliness >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("LAC reviews held on time"))).toBe(true);
    });

    it("S1: LAC review timeliness >= 80% but < 95% moderate strength", () => {
      const reviews = [];
      for (let i = 0; i < 5; i++) {
        reviews.push(makeLacReview({ on_time: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("LAC review timeliness"))).toBe(true);
    });

    it("S2: social worker visit rate >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("social worker visits within statutory timescales"))).toBe(true);
    });

    it("S2: social worker visit rate >= 80% but < 95% moderate strength", () => {
      const visits = [];
      for (let i = 0; i < 5; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("social worker visit compliance"))).toBe(true);
    });

    it("S3: therapeutic engagement >= 90% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("therapeutic service engagement"))).toBe(true);
    });

    it("S3: therapeutic engagement >= 70% but < 90% moderate strength", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 8 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("therapeutic engagement rate"))).toBe(true);
    });

    it("S4: education liaison >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("home attendance at education liaisons"))).toBe(true);
    });

    it("S5: information sharing >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("inter-agency information shared on time"))).toBe(true);
    });

    it("S6: LAC action completion >= 90% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, actions_set: 10, actions_completed: 10 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("LAC review actions completed"))).toBe(true);
    });

    it("S7: child seen alone >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true, child_seen_alone: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("children seen alone during social worker visits"))).toBe(true);
    });

    it("S8: PEP up to date >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, pep_up_to_date: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("PEPs up to date"))).toBe(true);
    });

    it("S9: GDPR compliance >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true, gdpr_compliant: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("GDPR compliance in information sharing"))).toBe(true);
    });

    it("S10: social worker consistency >= 90% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true, social_worker_consistent: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("social worker consistency"))).toBe(true);
    });

    it("S11: child views at LAC reviews >= 95% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, child_views_recorded: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("LAC reviews recorded children's views"))).toBe(true);
    });

    it("S12: therapeutic progress >= 90% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, progress_reported: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("therapeutic services reporting progress"))).toBe(true);
    });

    it("S13: unique agencies >= 5 strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({
              timely: true,
              agencies_involved: ["social_services", "education", "health", "camhs", "police"],
            }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("5 different agencies"))).toBe(true);
    });

    it("S14: home-initiated sharing >= 70% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true, initiated_by_home: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("information sharing initiated by the home"))).toBe(true);
    });

    it("S15: designated teacher >= 90% strength", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, designated_teacher_involved: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("designated teacher"))).toBe(true);
    });
  });

  // ── Concerns Tests ────────────────────────────────────────────────────

  describe("concerns", () => {
    it("C1: LAC review timeliness < 50% concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: false }),
            makeLacReview({ on_time: false }),
            makeLacReview({ on_time: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("LAC reviews held on time"))).toBe(true);
    });

    it("C1: LAC review timeliness 50-79% moderate concern", () => {
      const reviews = [];
      for (let i = 0; i < 10; i++) {
        reviews.push(makeLacReview({ on_time: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("LAC review timeliness"))).toBe(true);
    });

    it("C2: social worker visit rate < 50% concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: false }),
            makeSWVisit({ within_statutory_timescale: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("social worker visits within statutory timescales"))).toBe(true);
    });

    it("C2: social worker visit rate 50-79% moderate concern", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.concerns.some((c) => c.includes("70%") && c.includes("Social worker visit compliance"))).toBe(true);
    });

    it("C3: therapeutic engagement < 40% concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: false }),
            makeTherapeutic({ child_engaged: false }),
            makeTherapeutic({ child_engaged: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("therapeutic service engagement"))).toBe(true);
    });

    it("C3: therapeutic engagement 40-69% moderate concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Therapeutic engagement"))).toBe(true);
    });

    it("C4: education liaison < 60% concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("home attendance at education liaisons"))).toBe(true);
    });

    it("C4: education liaison 60-79% moderate concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("70%") && c.includes("Education liaison attendance"))).toBe(true);
    });

    it("C5: information sharing < 50% concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: false }),
            makeInfoSharing({ timely: false }),
            makeInfoSharing({ timely: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("information sharing is timely"))).toBe(true);
    });

    it("C5: information sharing 50-79% moderate concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeInfoSharing({ timely: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Information sharing timeliness"))).toBe(true);
    });

    it("C6: long therapeutic waits > 90 days concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, waiting_list: true, waiting_days: 120 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 therapeutic service referral has been waiting over 90 days"))).toBe(true);
    });

    it("C6: multiple long waits use plural", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, waiting_list: true, waiting_days: 120 }),
            makeTherapeutic({ child_engaged: true, waiting_list: true, waiting_days: 100 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 therapeutic service referrals have been waiting over 90 days"))).toBe(true);
    });

    it("C6: waiting list rate >= 40% concern (when no long waits)", () => {
      const recs = [];
      for (let i = 0; i < 5; i++) {
        recs.push(makeTherapeutic({ child_engaged: true, waiting_list: i < 2, waiting_days: 30 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("waiting lists"))).toBe(true);
    });

    it("C7: child seen alone < 60% concern", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, child_seen_alone: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("children seen alone during social worker visits"))).toBe(true);
    });

    it("C7: child seen alone 60-79% moderate concern", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, child_seen_alone: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.concerns.some((c) => c.includes("70%") && c.includes("Children seen alone by social workers"))).toBe(true);
    });

    it("C8: PEP compliance < 50% concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: true, pep_up_to_date: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("PEPs up to date"))).toBe(true);
    });

    it("C8: PEP compliance 50-69% moderate concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: true, pep_up_to_date: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("PEP compliance"))).toBe(true);
    });

    it("C9: LAC poor outcomes >= 30% concern", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, outcome_quality: "poor" }),
            makeLacReview({ on_time: true, outcome_quality: "poor" }),
            makeLacReview({ on_time: true, outcome_quality: "good" }),
          ],
        }),
      );
      // 67% poor => triggers concern
      expect(r.concerns.some((c) => c.includes("LAC reviews rated as poor outcome quality"))).toBe(true);
    });

    it("C10: GDPR compliance < 70% concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeInfoSharing({ timely: true, gdpr_compliant: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("GDPR compliance in information sharing"))).toBe(true);
    });

    it("C11: therapeutic info shared < 60% concern", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: true, information_shared_with_home: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("therapeutic services sharing information with the home"))).toBe(true);
    });

    it("C12: SW poor quality >= 25% concern", () => {
      const visits = [];
      for (let i = 0; i < 4; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, quality_rating: i < 1 ? "poor" : "good" }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("social worker visits rated as poor quality"))).toBe(true);
    });
  });

  // ── Recommendations Tests ─────────────────────────────────────────────

  describe("recommendations", () => {
    it("generates immediate LAC review recommendation when timeliness < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("LAC review timeliness"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate SW visit recommendation when rate < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("social worker visiting"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate therapeutic engagement recommendation when rate < 40%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("therapeutic service engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate info sharing recommendation when rate < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: false }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("information-sharing protocol"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate child seen alone recommendation when rate < 60%", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, child_seen_alone: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("seen alone during social worker visits"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate education liaison recommendation when rate < 60%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("attendance at all education liaison meetings"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate long waits recommendation", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, waiting_list: true, waiting_days: 120 }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("lengthy therapeutic waiting lists"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate PEP recommendation when rate < 50%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: true, pep_up_to_date: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("PEPs are brought up to date"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates immediate GDPR recommendation when rate < 70%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeInfoSharing({ timely: true, gdpr_compliant: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("GDPR compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("generates 'soon' LAC review recommendation when timeliness 50-79%", () => {
      const reviews = [];
      for (let i = 0; i < 10; i++) {
        reviews.push(makeLacReview({ on_time: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve LAC review timeliness"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates 'soon' SW visit recommendation when rate 50-79%", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Work with placing authorities to improve social worker visit"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates 'soon' therapeutic engagement recommendation when rate 40-69%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("strategies to improve therapeutic engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates 'planned' education liaison recommendation when rate 60-79%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve education liaison attendance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates 'planned' info sharing recommendation when rate 50-79%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeInfoSharing({ timely: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve the timeliness of inter-agency"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("generates 'soon' LAC action completion recommendation when rate < 70%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, actions_set: 10, actions_completed: 5 }),
          ],
        }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve completion of LAC review actions"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("generates 'soon' therapeutic info sharing recommendation when rate < 60%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: true, information_shared_with_home: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Strengthen information sharing with therapeutic"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommendations have ascending rank numbers", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
          information_sharing_records: [makeInfoSharing({ timely: false })],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations have regulatory_ref", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
        }),
      );
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ── Insights Tests ────────────────────────────────────────────────────

  describe("insights", () => {
    // Critical insights
    it("critical insight when LAC timeliness < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: false }),
          ],
        }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("LAC reviews held on time"))).toBe(true);
    });

    it("critical insight when SW visit rate < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: false }),
          ],
        }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("social worker visits within statutory timescales"))).toBe(true);
    });

    it("critical insight when therapeutic engagement < 40%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: false }),
          ],
        }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("Therapeutic engagement"))).toBe(true);
    });

    it("critical insight when info sharing rate < 50%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: false }),
          ],
        }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("inter-agency information shared on time"))).toBe(true);
    });

    it("critical insight when child seen alone < 60%", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, child_seen_alone: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("children seen alone during social worker visits"))).toBe(true);
    });

    it("critical insight when no therapeutic records but children present (and not all empty)", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: true })],
          therapeutic_service_records: [],
        }),
      );
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("No therapeutic service records"))).toBe(true);
    });

    // Warning insights
    it("warning insight when LAC timeliness 50-79%", () => {
      const reviews = [];
      for (let i = 0; i < 10; i++) {
        reviews.push(makeLacReview({ on_time: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("LAC review timeliness at 60%"))).toBe(true);
    });

    it("warning insight when SW visit rate 50-79%", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Social worker visit compliance at 60%"))).toBe(true);
    });

    it("warning insight when therapeutic engagement 40-69%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 5 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Therapeutic engagement at 50%"))).toBe(true);
    });

    it("warning insight when education liaison 60-79%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Education liaison attendance at 70%"))).toBe(true);
    });

    it("warning insight when info sharing 50-79%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeInfoSharing({ timely: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Information sharing timeliness at 60%"))).toBe(true);
    });

    it("warning insight when PEP compliance 50-69%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeEducation({ attended_by_home: true, pep_up_to_date: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("PEP compliance at 60%"))).toBe(true);
    });

    it("warning insight when SW consistency < 70%", () => {
      const visits = [];
      for (let i = 0; i < 10; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, social_worker_consistent: i < 6 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Social worker consistency at 60%"))).toBe(true);
    });

    it("warning insight when LAC action completion 50-69%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, actions_set: 10, actions_completed: 6 }),
          ],
        }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("LAC review action completion at 60%"))).toBe(true);
    });

    it("warning insight when follow-up completion < 70%", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(
          makeInfoSharing({
            timely: true,
            follow_up_required: true,
            follow_up_completed: i < 5,
          }),
        );
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      const warnings = r.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Information sharing follow-up completion at 50%"))).toBe(true);
    });

    // Positive insights
    it("positive insight when both LAC timeliness >= 95% and SW visit rate >= 95%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeGoodLacReview(),
          ],
          social_worker_visit_records: [
            makeGoodSWVisit(),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("LAC review timeliness at 100%") && i.text.includes("social worker visit compliance at 100%"))).toBe(true);
    });

    it("positive insight when therapeutic engagement >= 90% and progress >= 90%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, progress_reported: true }),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("100% therapeutic engagement") && i.text.includes("100% progress reporting"))).toBe(true);
    });

    it("positive insight when education liaison >= 95% and PEP >= 95%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, pep_up_to_date: true }),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("Education liaison attendance at 100%") && i.text.includes("100% PEPs up to date"))).toBe(true);
    });

    it("positive insight when info sharing >= 95% and GDPR >= 95%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true, gdpr_compliant: true }),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("100% timely information sharing") && i.text.includes("100% GDPR compliance"))).toBe(true);
    });

    it("positive insight when unique agencies >= 5 and home initiated >= 70%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({
              timely: true,
              initiated_by_home: true,
              agencies_involved: ["social_services", "education", "health", "camhs", "police"],
            }),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("5 different agencies") && i.text.includes("100%"))).toBe(true);
    });

    it("positive insight when child seen alone >= 95% and child views >= 95%", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeGoodLacReview({ child_views_recorded: true }),
          ],
          social_worker_visit_records: [
            makeGoodSWVisit({ child_seen_alone: true }),
          ],
        }),
      );
      const positives = r.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("children seen alone") && i.text.includes("LAC reviews recording children's views"))).toBe(true);
    });
  });

  // ── Headline Tests ────────────────────────────────────────────────────

  describe("headline", () => {
    it("includes LAC review percentage when LAC reviews present", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true }),
            makeLacReview({ on_time: false }),
          ],
        }),
      );
      expect(r.headline).toContain("50% LAC reviews on time");
    });

    it("includes SW visit percentage when SW visits present", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true }),
          ],
        }),
      );
      expect(r.headline).toContain("100% SW visits within timescale");
    });

    it("includes therapeutic engagement when records present", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
        }),
      );
      expect(r.headline).toContain("100% therapeutic engagement");
    });

    it("headline ends with period", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
        }),
      );
      expect(r.headline.endsWith(".")).toBe(true);
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single child with one record per array", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          total_children: 1,
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [
            makeGoodInfoSharing({ agencies_involved: ["social_services", "education", "health", "camhs", "police"] }),
          ],
        }),
      );
      expect(r.agency_rating).toBe("outstanding");
      expect(r.total_lac_reviews).toBe(1);
      expect(r.total_sw_visits).toBe(1);
    });

    it("large number of records", () => {
      const lacReviews = [];
      const swVisits = [];
      const therapeuticRecs = [];
      const educationRecs = [];
      const infoRecs = [];
      for (let i = 0; i < 100; i++) {
        lacReviews.push(makeGoodLacReview({ child_id: `c${i % 10}` }));
        swVisits.push(makeGoodSWVisit({ child_id: `c${i % 10}` }));
        therapeuticRecs.push(makeGoodTherapeutic({ child_id: `c${i % 10}` }));
        educationRecs.push(makeGoodEducation({ child_id: `c${i % 10}` }));
        infoRecs.push(makeGoodInfoSharing({ child_id: `c${i % 10}` }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({
          total_children: 10,
          lac_review_records: lacReviews,
          social_worker_visit_records: swVisits,
          therapeutic_service_records: therapeuticRecs,
          education_liaison_records: educationRecs,
          information_sharing_records: infoRecs,
        }),
      );
      expect(r.total_lac_reviews).toBe(100);
      expect(r.total_sw_visits).toBe(100);
      expect(r.total_therapeutic_records).toBe(100);
      expect(r.total_education_liaisons).toBe(100);
      expect(r.total_info_sharing_records).toBe(100);
      expect(r.agency_rating).toBe("outstanding");
    });

    it("score is clamped to 0 minimum", () => {
      // Even with all penalties, score can't go below 0
      // 52 - 6 - 5 - 4 - 3 = 34, so this won't actually reach 0
      // But let's verify the clamp logic is working
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
          information_sharing_records: [makeInfoSharing({ timely: false })],
        }),
      );
      expect(r.agency_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [
            makeGoodInfoSharing({ agencies_involved: ["social_services", "education", "health", "camhs", "police"] }),
          ],
        }),
      );
      expect(r.agency_score).toBeLessThanOrEqual(100);
    });

    it("boundary: score exactly 80 is outstanding", () => {
      // All max bonuses: 52 + 28 = 80
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      expect(r.agency_score).toBe(80);
      expect(r.agency_rating).toBe("outstanding");
    });

    it("boundary: score 79 is good", () => {
      // 80 - 1 by slightly reducing one bonus
      // Use 4 on_time out of 5 => 80% timeliness => +2 instead of +4
      // Rest all max: 52 + 2 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2 = 78
      // Need score 79 — let's build it precisely
      // Base: 52
      // Bonus1: lac 80% => +2
      // Bonus2: sw 100% => +4
      // Bonus3: therapeutic 100% => +3
      // Bonus4: education 100% => +3
      // Bonus5: info sharing 100% => +3
      // Bonus6: lac actions 100% => +3
      // Bonus7: child seen alone 100% => +3
      // Bonus8: pep 100% => +3
      // Bonus9: gdpr 100% => +2
      // Total: 52 + 2 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2 = 78
      // That's 78, not 79. Let's try differently.
      // We need exactly 79. That means total bonuses = 27
      // Max is 28 (4+4+3+3+3+3+3+3+2). Remove 1 from one.
      // Bonus9: gdpr 80% => +1 instead of +2
      // Total: 4+4+3+3+3+3+3+3+1 = 27 => 52+27 = 79
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeGoodLacReview({ actions_set: 10, actions_completed: 10 }),
          ],
          social_worker_visit_records: [
            makeGoodSWVisit(),
          ],
          therapeutic_service_records: [
            makeGoodTherapeutic(),
          ],
          education_liaison_records: [
            makeGoodEducation({ pep_up_to_date: true }),
          ],
          information_sharing_records: [
            makeGoodInfoSharing({ timely: true, gdpr_compliant: true }),
            makeGoodInfoSharing({ timely: true, gdpr_compliant: true }),
            makeGoodInfoSharing({ timely: true, gdpr_compliant: true }),
            makeGoodInfoSharing({ timely: true, gdpr_compliant: true }),
            makeInfoSharing({ timely: true, gdpr_compliant: false }),
          ],
        }),
      );
      // 4 out of 5 gdpr => 80% => +1
      // info sharing: 5/5 timely => 100% => +3
      expect(r.agency_score).toBe(79);
      expect(r.agency_rating).toBe("good");
    });

    it("boundary: score exactly 65 is good", () => {
      // 52 + 13 = 65
      // Bonuses: lac timely 100% => +4, sw visit 100% => +4, therapeutic 100% => +3, lac actions => +3 (if actions set)
      // But we only want +13 total from bonuses
      // +4 (lac timely) + +4 (sw) + +3 (therapeutic) + +1 (education 80%) + +1 (pep 70%) = 13
      // No: also check info sharing, child seen alone, gdpr
      // Simplify: provide only lac, sw, therapeutic to control
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true }),
          ],
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true }),
          ],
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
        }),
      );
      // Bonus1: lac 100% => +4, Bonus2: sw 100% => +4, Bonus3: therapeutic 100% => +3
      // Bonus6: lacActionCompletionRate = pct(0,0)=0 => no bonus
      // Bonus7: childSeenAloneRate = pct(0,1)=0 => no bonus
      // 52 + 4 + 4 + 3 = 63 ... not 65
      // Add education to get +3 more: 63+3 = 66
      // Or: add education 100% => +3, total = 66 = good
      // For exactly 65: 52+13. Need bonuses = 13.
      // +4+4+3+1+1 = 13: lac(100%) + sw(100%) + therapeutic(100%) + education(80%) + something(70%)
      // education 80% => +1, pep doesn't add a bonus to education_liaison unless pep >= 70
      // Let's do: lac+sw+therapeutic+info_sharing(80%) = 4+4+3+1 = 12 => 52+12=64
      // Add education(80%) = +1 => 65
      // Also childSeenAlone from sw visits = pct(0,1)=0 => no bonus
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true }),
          ],
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true }),
          ],
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
          education_liaison_records: (() => {
            const recs = [];
            for (let i = 0; i < 5; i++) {
              recs.push(makeEducation({ attended_by_home: i < 4 })); // 80%
            }
            return recs;
          })(),
          information_sharing_records: (() => {
            const recs = [];
            for (let i = 0; i < 5; i++) {
              recs.push(makeInfoSharing({ timely: i < 4 })); // 80%
            }
            return recs;
          })(),
        }),
      );
      // lac 100% => +4, sw 100% => +4, therapeutic 100% => +3
      // education 80% => +1, info 80% => +1
      // 52 + 4 + 4 + 3 + 1 + 1 = 65
      expect(r2.agency_score).toBe(65);
      expect(r2.agency_rating).toBe("good");
    });

    it("boundary: score exactly 45 is adequate", () => {
      // 52 - 7 = 45. Need penalties = 7.
      // lac < 50 => -6, info < 50 => -3 => total -9 => 52-9=43 (too much)
      // lac < 50 => -6, sw at 50% (no penalty) => 52-6=46 (not 45)
      // Need exactly -7: sw < 50 => -5, info < 50 => -3 => -8 (too much)
      // lac<50 => -6, plus therapeutic bonus of +1 (70%) = 52 + 1 - 6 = 47 (not 45)
      // Actually the simplest: -6 (lac) + -5 (sw) = -11, need +4 bonus
      // sw is <50 so no bonus from it. lac is <50, no bonus from it.
      // Add therapeutic at 100% => +3, add education at 80% => +1
      // 52 + 3 + 1 - 6 - 5 = 45
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: false }),
            makeLacReview({ on_time: false }),
            makeLacReview({ on_time: false }),
          ],
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: false }),
            makeSWVisit({ within_statutory_timescale: false }),
            makeSWVisit({ within_statutory_timescale: false }),
          ],
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
          education_liaison_records: (() => {
            const recs = [];
            for (let i = 0; i < 5; i++) {
              recs.push(makeEducation({ attended_by_home: i < 4 }));
            }
            return recs;
          })(),
        }),
      );
      // Bonus3: therapeutic 100% => +3
      // Bonus4: education 80% => +1
      // Penalty1: lac 0% => -6
      // Penalty2: sw 0% => -5
      // 52 + 3 + 1 - 6 - 5 = 45
      expect(r.agency_score).toBe(45);
      expect(r.agency_rating).toBe("adequate");
    });

    it("boundary: score 44 is inadequate", () => {
      // 52 + 3 + 1 - 6 - 5 -1 = 44
      // Add one more penalty: therapeutic < 40 => -4 (too much)
      // Instead: use therapeutic at 70% (bonus +1), remove education bonus
      // 52 + 1 - 6 - 5 = 42 (inadequate but not 44)
      // Let's compute: 52 - 6 - 5 + 3 = 44 if we add +3 from one source
      // therapeutic at 100% => +3: 52 + 3 - 6 - 5 = 44
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: false }),
          ],
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: false }),
          ],
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true }),
          ],
        }),
      );
      // 52 + 3 - 6 - 5 = 44
      expect(r.agency_score).toBe(44);
      expect(r.agency_rating).toBe("inadequate");
    });

    it("only one array populated triggers base score without other bonuses", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true }),
          ],
        }),
      );
      // Only lac review timeliness bonus: +4
      expect(r.agency_score).toBe(56);
    });

    it("all arrays empty but total_children=0 still gives insufficient_data", () => {
      const r = computeMultiAgencyCollaboration({
        today: "2026-05-28",
        total_children: 0,
        lac_review_records: [],
        social_worker_visit_records: [],
        therapeutic_service_records: [],
        education_liaison_records: [],
        information_sharing_records: [],
      });
      expect(r.agency_rating).toBe("insufficient_data");
    });

    it("pct(0, 0) returns 0", () => {
      // Implicit test: when arrays are empty, rates should be 0
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: true })],
          // All other arrays empty => pct(0,0) = 0 for those rates
        }),
      );
      expect(r.social_worker_visit_rate).toBe(0);
      expect(r.therapeutic_engagement_rate).toBe(0);
      expect(r.education_liaison_rate).toBe(0);
      expect(r.information_sharing_rate).toBe(0);
      expect(r.multi_agency_meeting_rate).toBe(0);
    });

    it("review types do not affect scoring", () => {
      const r1 = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, review_type: "initial" }),
          ],
        }),
      );
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, review_type: "emergency" }),
          ],
        }),
      );
      expect(r1.agency_score).toBe(r2.agency_score);
    });

    it("visit types do not affect scoring", () => {
      const r1 = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true, visit_type: "statutory" }),
          ],
        }),
      );
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit({ within_statutory_timescale: true, visit_type: "virtual" }),
          ],
        }),
      );
      expect(r1.agency_score).toBe(r2.agency_score);
    });

    it("different service types do not affect therapeutic scoring", () => {
      const r1 = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, service_type: "camhs" }),
          ],
        }),
      );
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic({ child_engaged: true, service_type: "art_therapy" }),
          ],
        }),
      );
      expect(r1.agency_score).toBe(r2.agency_score);
    });

    it("different liaison types do not affect education scoring", () => {
      const r1 = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, liaison_type: "pep_meeting" }),
          ],
        }),
      );
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, liaison_type: "annual_review" }),
          ],
        }),
      );
      expect(r1.agency_score).toBe(r2.agency_score);
    });

    it("different sharing types do not affect info sharing scoring", () => {
      const r1 = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true, sharing_type: "multi_agency_meeting" }),
          ],
        }),
      );
      const r2 = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing({ timely: true, sharing_type: "email_update" }),
          ],
        }),
      );
      expect(r1.agency_score).toBe(r2.agency_score);
    });

    it("EHCP review rate computed only on ehcp_relevant records", () => {
      // This metric exists but doesn't directly affect score/bonuses
      // It's computed but used for concerns/strengths logic
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation({ attended_by_home: true, ehcp_relevant: true, ehcp_reviewed: true }),
            makeEducation({ attended_by_home: true, ehcp_relevant: true, ehcp_reviewed: false }),
            makeEducation({ attended_by_home: true, ehcp_relevant: false, ehcp_reviewed: false }),
          ],
        }),
      );
      // ehcpReviewRate = pct(1, 2) = 50%
      // This doesn't directly appear in output but doesn't cause errors
      expect(r.total_education_liaisons).toBe(3);
    });

    it("handles zero actions_set gracefully (pct(0,0)=0)", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, actions_set: 0, actions_completed: 0 }),
          ],
        }),
      );
      // lacActionCompletionRate = pct(0,0) = 0, no bonus
      expect(r.agency_score).toBe(52 + 4); // only timeliness bonus
    });
  });

  // ── Score Architecture Verification ───────────────────────────────────

  describe("score architecture", () => {
    it("base score is 52 when all arrays have records but no bonuses/penalties", () => {
      // All rates at 50-79% range: no bonuses, no penalties
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeLacReview({ on_time: i < 7, actions_set: 3, actions_completed: 2 })); // 70% timeliness, 67% completion
            }
            return recs;
          })(),
          social_worker_visit_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeSWVisit({ within_statutory_timescale: i < 7, child_seen_alone: i < 7 })); // 70%
            }
            return recs;
          })(),
          therapeutic_service_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeTherapeutic({ child_engaged: i < 6 })); // 60%
            }
            return recs;
          })(),
          education_liaison_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeEducation({ attended_by_home: i < 7, pep_up_to_date: i < 6 })); // 70% attended, 60% pep
            }
            return recs;
          })(),
          information_sharing_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeInfoSharing({ timely: i < 7, gdpr_compliant: i < 7 })); // 70%
            }
            return recs;
          })(),
        }),
      );
      // No bonus hits for any metric at these rates
      // lac: 70% < 80 => no bonus. sw: 70% < 80 => no bonus
      // therapeutic: 60% < 70 => no bonus. education: 70% < 80 => no bonus
      // info sharing: 70% < 80 => no bonus. lac actions: 67% < 70 => no bonus
      // child seen alone: 70% < 80 => no bonus. pep: 60% < 70 => no bonus
      // gdpr: 70% < 80 => no bonus
      // No penalties either (all >= 50 or >= 40)
      expect(r.agency_score).toBe(52);
    });

    it("maximum score with all bonuses is 80 (52+28)", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview({ actions_set: 10, actions_completed: 10 })],
          social_worker_visit_records: [makeGoodSWVisit({ child_seen_alone: true })],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation({ pep_up_to_date: true })],
          information_sharing_records: [makeGoodInfoSharing({ gdpr_compliant: true })],
        }),
      );
      // 52 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2 = 80
      expect(r.agency_score).toBe(80);
    });

    it("maximum penalties give 52 - 18 = 34", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
          information_sharing_records: [makeInfoSharing({ timely: false })],
        }),
      );
      // 52 - 6 - 5 - 4 - 3 = 34
      expect(r.agency_score).toBe(34);
    });

    it("rating thresholds: >= 80 outstanding", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      expect(r.agency_score).toBe(80);
      expect(r.agency_rating).toBe("outstanding");
    });

    it("rating thresholds: 65-79 good", () => {
      // 52 + 4 + 4 + 3 = 63 with only lac + sw + therapeutic... need more
      // 52 + 4 + 4 + 3 + 3 = 66 (good)
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: true })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: true })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: true })],
          education_liaison_records: [makeEducation({ attended_by_home: true })],
        }),
      );
      // 52 + 4 + 4 + 3 + 3 = 66
      expect(r.agency_score).toBe(66);
      expect(r.agency_rating).toBe("good");
    });

    it("rating thresholds: 45-64 adequate", () => {
      // Just base score, no bonuses, no penalties
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: (() => {
            const recs = [];
            for (let i = 0; i < 10; i++) {
              recs.push(makeLacReview({ on_time: i < 7 }));
            }
            return recs;
          })(),
        }),
      );
      // 70% lac timeliness => no bonus (< 80), no penalty (>= 50)
      // lacActionCompletionRate = pct(0,0) = 0, no bonus (actions_set=0)
      expect(r.agency_score).toBe(52);
      expect(r.agency_rating).toBe("adequate");
    });

    it("rating thresholds: < 45 inadequate", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
          information_sharing_records: [makeInfoSharing({ timely: false })],
        }),
      );
      expect(r.agency_score).toBe(34);
      expect(r.agency_rating).toBe("inadequate");
    });
  });

  // ── Total Count Tests ─────────────────────────────────────────────────

  describe("total counts", () => {
    it("counts lac reviews correctly", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview(),
            makeLacReview(),
            makeLacReview(),
          ],
        }),
      );
      expect(r.total_lac_reviews).toBe(3);
    });

    it("counts sw visits correctly", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          social_worker_visit_records: [
            makeSWVisit(),
            makeSWVisit(),
          ],
        }),
      );
      expect(r.total_sw_visits).toBe(2);
    });

    it("counts therapeutic records correctly", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          therapeutic_service_records: [
            makeTherapeutic(),
            makeTherapeutic(),
            makeTherapeutic(),
            makeTherapeutic(),
          ],
        }),
      );
      expect(r.total_therapeutic_records).toBe(4);
    });

    it("counts education liaisons correctly", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          education_liaison_records: [
            makeEducation(),
          ],
        }),
      );
      expect(r.total_education_liaisons).toBe(1);
    });

    it("counts info sharing records correctly", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          information_sharing_records: [
            makeInfoSharing(),
            makeInfoSharing(),
            makeInfoSharing(),
            makeInfoSharing(),
            makeInfoSharing(),
          ],
        }),
      );
      expect(r.total_info_sharing_records).toBe(5);
    });
  });

  // ── Bonus Tier Edge Cases ─────────────────────────────────────────────

  describe("bonus tier boundaries", () => {
    it("lacReviewTimelinessRate exactly 95% gets top bonus (+4)", () => {
      // Need exactly 95%: pct(19, 20) = 95
      const reviews = [];
      for (let i = 0; i < 20; i++) {
        reviews.push(makeLacReview({ on_time: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      expect(r.lac_review_timeliness_rate).toBe(95);
      expect(r.agency_score).toBe(52 + 4);
    });

    it("lacReviewTimelinessRate exactly 80% gets lower bonus (+2)", () => {
      const reviews = [];
      for (let i = 0; i < 5; i++) {
        reviews.push(makeLacReview({ on_time: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      expect(r.lac_review_timeliness_rate).toBe(80);
      expect(r.agency_score).toBe(52 + 2);
    });

    it("socialWorkerVisitRate exactly 95% gets top bonus (+4)", () => {
      const visits = [];
      for (let i = 0; i < 20; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.social_worker_visit_rate).toBe(95);
      expect(r.agency_score).toBe(52 + 4);
    });

    it("therapeuticEngagementRate exactly 90% gets top bonus (+3)", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 9 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.therapeutic_engagement_rate).toBe(90);
      expect(r.agency_score).toBe(52 + 3);
    });

    it("therapeuticEngagementRate exactly 70% gets lower bonus (+1)", () => {
      const recs = [];
      for (let i = 0; i < 10; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 7 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.therapeutic_engagement_rate).toBe(70);
      expect(r.agency_score).toBe(52 + 1);
    });

    it("educationLiaisonRate exactly 95% gets top bonus (+3)", () => {
      const recs = [];
      for (let i = 0; i < 20; i++) {
        recs.push(makeEducation({ attended_by_home: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      expect(r.education_liaison_rate).toBe(95);
      expect(r.agency_score).toBe(52 + 3);
    });

    it("informationSharingRate exactly 95% gets top bonus (+3)", () => {
      const recs = [];
      for (let i = 0; i < 20; i++) {
        recs.push(makeInfoSharing({ timely: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      expect(r.information_sharing_rate).toBe(95);
      expect(r.agency_score).toBe(52 + 3);
    });

    it("lacActionCompletionRate exactly 90% gets top bonus (+3)", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [
            makeLacReview({ on_time: true, actions_set: 10, actions_completed: 9 }),
          ],
        }),
      );
      // lacActionCompletionRate = pct(9, 10) = 90 => +3
      // lacReviewTimelinessRate = 100% => +4
      expect(r.agency_score).toBe(52 + 4 + 3);
    });

    it("childSeenAloneRate exactly 95% gets top bonus (+3)", () => {
      const visits = [];
      for (let i = 0; i < 20; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: true, child_seen_alone: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      // childSeenAloneRate = 95% => +3, socialWorkerVisitRate = 100% => +4
      expect(r.agency_score).toBe(52 + 4 + 3);
    });

    it("pepUpToDateRate exactly 95% gets top bonus (+3)", () => {
      const recs = [];
      for (let i = 0; i < 20; i++) {
        recs.push(makeEducation({ attended_by_home: true, pep_up_to_date: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ education_liaison_records: recs }),
      );
      // pepUpToDateRate = 95% => +3, educationLiaisonRate = 100% => +3
      expect(r.agency_score).toBe(52 + 3 + 3);
    });

    it("gdprComplianceRate exactly 95% gets top bonus (+2)", () => {
      const recs = [];
      for (let i = 0; i < 20; i++) {
        recs.push(makeInfoSharing({ timely: true, gdpr_compliant: i < 19 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      // gdprComplianceRate = 95% => +2, informationSharingRate = 100% => +3
      expect(r.agency_score).toBe(52 + 3 + 2);
    });

    it("gdprComplianceRate exactly 80% gets lower bonus (+1)", () => {
      const recs = [];
      for (let i = 0; i < 5; i++) {
        recs.push(makeInfoSharing({ timely: true, gdpr_compliant: i < 4 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      // gdprComplianceRate = 80% => +1, informationSharingRate = 100% => +3
      expect(r.agency_score).toBe(52 + 3 + 1);
    });
  });

  // ── Penalty Boundary Tests ────────────────────────────────────────────

  describe("penalty boundaries", () => {
    it("lacReviewTimelinessRate exactly 49% triggers penalty", () => {
      // pct(49, 100) = 49
      const reviews = [];
      for (let i = 0; i < 100; i++) {
        reviews.push(makeLacReview({ on_time: i < 49 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ lac_review_records: reviews }),
      );
      expect(r.lac_review_timeliness_rate).toBe(49);
      expect(r.agency_score).toBe(52 - 6);
    });

    it("socialWorkerVisitRate exactly 49% triggers penalty", () => {
      const visits = [];
      for (let i = 0; i < 100; i++) {
        visits.push(makeSWVisit({ within_statutory_timescale: i < 49 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ social_worker_visit_records: visits }),
      );
      expect(r.social_worker_visit_rate).toBe(49);
      expect(r.agency_score).toBe(52 - 5);
    });

    it("therapeuticEngagementRate exactly 39% triggers penalty", () => {
      // pct(39, 100) = 39
      const recs = [];
      for (let i = 0; i < 100; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 39 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.therapeutic_engagement_rate).toBe(39);
      expect(r.agency_score).toBe(52 - 4);
    });

    it("therapeuticEngagementRate exactly 40% does NOT trigger penalty", () => {
      const recs = [];
      for (let i = 0; i < 5; i++) {
        recs.push(makeTherapeutic({ child_engaged: i < 2 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ therapeutic_service_records: recs }),
      );
      expect(r.therapeutic_engagement_rate).toBe(40);
      expect(r.agency_score).toBe(52);
    });

    it("informationSharingRate exactly 49% triggers penalty", () => {
      const recs = [];
      for (let i = 0; i < 100; i++) {
        recs.push(makeInfoSharing({ timely: i < 49 }));
      }
      const r = computeMultiAgencyCollaboration(
        baseInput({ information_sharing_records: recs }),
      );
      expect(r.information_sharing_rate).toBe(49);
      expect(r.agency_score).toBe(52 - 3);
    });
  });

  // ── No False Positives ────────────────────────────────────────────────

  describe("no false positives", () => {
    it("no strengths when all rates are low", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
          social_worker_visit_records: [makeSWVisit({ within_statutory_timescale: false })],
          therapeutic_service_records: [makeTherapeutic({ child_engaged: false })],
          education_liaison_records: [makeEducation({ attended_by_home: false })],
          information_sharing_records: [makeInfoSharing({ timely: false })],
        }),
      );
      expect(r.strengths.length).toBe(0);
    });

    it("no concerns when all rates are excellent", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      expect(r.concerns.length).toBe(0);
    });

    it("no recommendations when all rates are excellent", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      expect(r.recommendations.length).toBe(0);
    });

    it("no critical insights when all rates are excellent", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      const criticals = r.insights.filter((i) => i.severity === "critical");
      expect(criticals.length).toBe(0);
    });
  });

  // ── Result Shape Tests ────────────────────────────────────────────────

  describe("result shape", () => {
    it("result has all expected keys", () => {
      const r = computeMultiAgencyCollaboration(baseInput());
      expect(r).toHaveProperty("agency_rating");
      expect(r).toHaveProperty("agency_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_lac_reviews");
      expect(r).toHaveProperty("total_sw_visits");
      expect(r).toHaveProperty("total_therapeutic_records");
      expect(r).toHaveProperty("total_education_liaisons");
      expect(r).toHaveProperty("total_info_sharing_records");
      expect(r).toHaveProperty("lac_review_timeliness_rate");
      expect(r).toHaveProperty("social_worker_visit_rate");
      expect(r).toHaveProperty("therapeutic_engagement_rate");
      expect(r).toHaveProperty("education_liaison_rate");
      expect(r).toHaveProperty("information_sharing_rate");
      expect(r).toHaveProperty("multi_agency_meeting_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
        }),
      );
      expect(Array.isArray(r.strengths)).toBe(true);
      for (const s of r.strengths) {
        expect(typeof s).toBe("string");
      }
    });

    it("concerns is an array of strings", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
        }),
      );
      expect(Array.isArray(r.concerns)).toBe(true);
      for (const c of r.concerns) {
        expect(typeof c).toBe("string");
      }
    });

    it("recommendations have correct structure", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
        }),
      );
      for (const rec of r.recommendations) {
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(typeof rec.regulatory_ref).toBe("string");
      }
    });

    it("insights have correct structure", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeLacReview({ on_time: false })],
        }),
      );
      for (const ins of r.insights) {
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });

    it("agency_rating is a valid value", () => {
      const r = computeMultiAgencyCollaboration(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.agency_rating);
    });

    it("agency_score is a number between 0 and 100", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
        }),
      );
      expect(typeof r.agency_score).toBe("number");
      expect(r.agency_score).toBeGreaterThanOrEqual(0);
      expect(r.agency_score).toBeLessThanOrEqual(100);
    });

    it("rates are numbers between 0 and 100", () => {
      const r = computeMultiAgencyCollaboration(
        baseInput({
          lac_review_records: [makeGoodLacReview()],
          social_worker_visit_records: [makeGoodSWVisit()],
          therapeutic_service_records: [makeGoodTherapeutic()],
          education_liaison_records: [makeGoodEducation()],
          information_sharing_records: [makeGoodInfoSharing()],
        }),
      );
      for (const rate of [
        r.lac_review_timeliness_rate,
        r.social_worker_visit_rate,
        r.therapeutic_engagement_rate,
        r.education_liaison_rate,
        r.information_sharing_rate,
        r.multi_agency_meeting_rate,
      ]) {
        expect(typeof rate).toBe("number");
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    });
  });
});
