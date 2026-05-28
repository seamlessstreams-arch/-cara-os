import { describe, it, expect } from "vitest";
import {
  computeFamilySocialConnectivity,
  type FamilySocialConnectivityInput,
  type FamilyTimeSessionInput,
  type ContactPlanInput,
  type ParentPartnershipRecordInput,
  type SocialWorkerContactInput,
  type SiblingContactProtocolInput,
} from "../home-family-social-connectivity-intelligence-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const TODAY = "2025-06-01";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Make helpers ───────────────────────────────────────────────────────────

let _uid = 0;
function uid(): string {
  return `id-${++_uid}`;
}

function makeSession(overrides: Partial<FamilyTimeSessionInput> = {}): FamilyTimeSessionInput {
  return {
    id: uid(),
    child_id: "C1",
    session_date: daysAgo(7),
    session_type: "face_to_face",
    family_member: "Mother",
    duration_minutes: 60,
    quality_rating: 4,
    child_voice_captured: true,
    child_enjoyed: true,
    post_contact_distress: false,
    follow_up_actions: null,
    staff_id: "S1",
    created_at: daysAgo(7),
    ...overrides,
  };
}

function makeContactPlan(overrides: Partial<ContactPlanInput> = {}): ContactPlanInput {
  return {
    id: uid(),
    child_id: "C1",
    contact_type: "face_to_face",
    frequency: "weekly",
    status: "active",
    last_reviewed: daysAgo(30),
    created_at: daysAgo(90),
    ...overrides,
  };
}

function makeParentPartnership(overrides: Partial<ParentPartnershipRecordInput> = {}): ParentPartnershipRecordInput {
  return {
    id: uid(),
    child_id: "C1",
    parent_name: "Jane Doe",
    engagement_level: "high",
    communication_method: "face_to_face",
    last_contact_date: daysAgo(7),
    partnership_quality: "positive",
    created_at: daysAgo(60),
    ...overrides,
  };
}

function makeSWContact(overrides: Partial<SocialWorkerContactInput> = {}): SocialWorkerContactInput {
  return {
    id: uid(),
    child_id: "C1",
    contact_date: daysAgo(7),
    contact_type: "visit",
    purpose: "Statutory visit",
    child_seen: true,
    outcome_recorded: true,
    created_at: daysAgo(7),
    ...overrides,
  };
}

function makeSiblingProtocol(overrides: Partial<SiblingContactProtocolInput> = {}): SiblingContactProtocolInput {
  return {
    id: uid(),
    child_id: "C1",
    sibling_name: "Sibling A",
    contact_frequency: "monthly",
    last_contact_date: daysAgo(14),
    protocol_status: "active",
    contact_maintained: true,
    created_at: daysAgo(90),
    ...overrides,
  };
}

/**
 * Neutral base: every metric sits in a "no bonus, no penalty" zone so the
 * raw score is exactly 52.  Override individual arrays to test one bonus or
 * penalty in isolation.
 *
 * Metric values with this base (5 children):
 *   sessionQualityAvg  = (2+3+2)/3 = 2.3   → no bonus
 *   contactPlanCoverage = pct(3,5) = 60     → no bonus, no penalty
 *   parentEngagementRate = pct(2,4) = 50    → no bonus, no penalty
 *   socialWorkerContactRate = pct(3,5) = 60 → no bonus, no penalty
 *   siblingContactCompliance = pct(2,3) = 67 → no bonus
 *   childVoiceCaptureRate = pct(2,3) = 67   → no bonus
 *   sessionsPerChild = round(3/5*10)/10 = 0.6 → no bonus
 *   postContactDistressRate = pct(1,3) = 33 → no bonus, no penalty
 *   diverseSessionTypes = 1                  → no bonus
 */
function neutralBase(): FamilySocialConnectivityInput {
  return {
    today: TODAY,
    total_children: 5,
    total_staff: 3,
    family_time_sessions: [
      makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: true, post_contact_distress: false }),
      makeSession({ child_id: "C2", quality_rating: 3, child_voice_captured: true, post_contact_distress: false }),
      makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
    ],
    contact_plans: [
      makeContactPlan({ child_id: "C1" }),
      makeContactPlan({ child_id: "C2" }),
      makeContactPlan({ child_id: "C3" }),
    ],
    parent_partnership_records: [
      makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
      makeParentPartnership({ child_id: "C2", engagement_level: "medium" }),
      makeParentPartnership({ child_id: "C3", engagement_level: "low" }),
      makeParentPartnership({ child_id: "C4", engagement_level: "none" }),
    ],
    social_worker_contacts: [
      makeSWContact({ child_id: "C1" }),
      makeSWContact({ child_id: "C2" }),
      makeSWContact({ child_id: "C3" }),
    ],
    sibling_contact_protocols: [
      makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
      makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
      makeSiblingProtocol({ child_id: "C3", contact_maintained: false }),
    ],
  };
}

function baseInput(overrides: Partial<FamilySocialConnectivityInput> = {}): FamilySocialConnectivityInput {
  return { ...neutralBase(), ...overrides };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. SPECIAL CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Home Family Social Connectivity Intelligence Engine", () => {
  describe("Special cases", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 0, total_staff: 0,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.connectivity_rating).toBe("insufficient_data");
      expect(r.connectivity_score).toBe(0);
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
      expect(r.headline).toContain("Insufficient data");
    });

    it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 4, total_staff: 3,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.connectivity_rating).toBe("inadequate");
      expect(r.connectivity_score).toBe(15);
      expect(r.concerns).toHaveLength(5);
      expect(r.recommendations).toHaveLength(5);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("special-case inadequate has correct 5 recommendation ranks and urgencies", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 2, total_staff: 1,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.recommendations.map((x) => x.rank)).toEqual([1, 2, 3, 4, 5]);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[4].urgency).toBe("soon");
    });

    it("special-case inadequate has all zero metrics", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 1, total_staff: 1,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.total_sessions).toBe(0);
      expect(r.sessions_per_child).toBe(0);
      expect(r.session_quality_avg).toBe(0);
      expect(r.contact_plan_coverage).toBe(0);
      expect(r.parent_engagement_rate).toBe(0);
      expect(r.social_worker_contact_rate).toBe(0);
      expect(r.sibling_contact_compliance).toBe(0);
      expect(r.child_voice_capture_rate).toBe(0);
      expect(r.post_contact_distress_rate).toBe(0);
    });

    it("insufficient_data even with staff > 0 when children=0 and all arrays empty", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 0, total_staff: 10,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.connectivity_rating).toBe("insufficient_data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. BASE SCORE
  // ════════════════════════════════════════════════════════════════════════════

  describe("Base score (52)", () => {
    it("equals exactly 52 with neutral data triggering no bonuses and no penalties", () => {
      const r = computeFamilySocialConnectivity(neutralBase());
      expect(r.connectivity_score).toBe(52);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. INDIVIDUAL BONUSES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Individual bonuses", () => {
    it("session quality >= 4.0 → +4", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 4, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 4, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C3", quality_rating: 5, child_voice_captured: false, post_contact_distress: false }),
      ];
      // avg = 4.3 → +4, voice 0%, distress 33%, 1 type, 0.6/child → all no bonus
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 4);
    });

    it("session quality >= 3.0 and < 4.0 → +2", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 3, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C3", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
      ];
      // avg = 3.0 → +2
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 2);
    });

    it("contact plan coverage >= 95 → +4", () => {
      const input = neutralBase();
      input.contact_plans = [
        makeContactPlan({ child_id: "C1" }),
        makeContactPlan({ child_id: "C2" }),
        makeContactPlan({ child_id: "C3" }),
        makeContactPlan({ child_id: "C4" }),
        makeContactPlan({ child_id: "C5" }),
      ];
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 4);
    });

    it("contact plan coverage >= 80 and < 95 → +2", () => {
      const input = neutralBase();
      input.contact_plans = [
        makeContactPlan({ child_id: "C1" }),
        makeContactPlan({ child_id: "C2" }),
        makeContactPlan({ child_id: "C3" }),
        makeContactPlan({ child_id: "C4" }),
      ];
      // pct(4,5)=80 → +2
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 2);
    });

    it("parent engagement >= 80 → +4", () => {
      const input = neutralBase();
      input.parent_partnership_records = [
        makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
        makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
        makeParentPartnership({ child_id: "C3", engagement_level: "medium" }),
        makeParentPartnership({ child_id: "C4", engagement_level: "medium" }),
        makeParentPartnership({ child_id: "C5", engagement_level: "low" }),
      ];
      // pct(4,5)=80 → +4
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 4);
    });

    it("parent engagement >= 60 and < 80 → +2", () => {
      const input = neutralBase();
      input.parent_partnership_records = [
        makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
        makeParentPartnership({ child_id: "C2", engagement_level: "medium" }),
        makeParentPartnership({ child_id: "C3", engagement_level: "medium" }),
        makeParentPartnership({ child_id: "C4", engagement_level: "low" }),
        makeParentPartnership({ child_id: "C5", engagement_level: "none" }),
      ];
      // pct(3,5)=60 → +2
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 2);
    });

    it("social worker contact rate >= 100 → +3", () => {
      const input = neutralBase();
      input.social_worker_contacts = [
        makeSWContact({ child_id: "C1" }),
        makeSWContact({ child_id: "C2" }),
        makeSWContact({ child_id: "C3" }),
        makeSWContact({ child_id: "C4" }),
        makeSWContact({ child_id: "C5" }),
      ];
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 3);
    });

    it("social worker contact rate >= 80 and < 100 → +1", () => {
      const input = neutralBase();
      input.social_worker_contacts = [
        makeSWContact({ child_id: "C1" }),
        makeSWContact({ child_id: "C2" }),
        makeSWContact({ child_id: "C3" }),
        makeSWContact({ child_id: "C4" }),
      ];
      // pct(4,5)=80 → +1
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });

    it("sibling compliance >= 90 → +3", () => {
      const input = neutralBase();
      input.sibling_contact_protocols = Array.from({ length: 10 }, (_, i) =>
        makeSiblingProtocol({ child_id: `C${(i % 5) + 1}`, contact_maintained: i < 9 }),
      );
      // pct(9,10)=90 → +3
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 3);
    });

    it("sibling compliance >= 70 and < 90 → +1", () => {
      const input = neutralBase();
      input.sibling_contact_protocols = Array.from({ length: 10 }, (_, i) =>
        makeSiblingProtocol({ child_id: `C${(i % 5) + 1}`, contact_maintained: i < 7 }),
      );
      // pct(7,10)=70 → +1
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });

    it("child voice capture rate >= 90 → +3", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: true, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: true, post_contact_distress: false }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: true, post_contact_distress: false }),
      ];
      // voice = 100% → +3, quality 2 → 0, distress 33% → 0, 1 type, 0.6/child
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 3);
    });

    it("child voice capture rate >= 70 and < 90 → +1", () => {
      const input = neutralBase();
      input.family_time_sessions = Array.from({ length: 7 }, (_, i) =>
        makeSession({
          child_id: `C${(i % 5) + 1}`,
          quality_rating: 2,
          child_voice_captured: i < 5,
          post_contact_distress: i < 2, // pct(2,7)=29 → no bonus, no penalty
        }),
      );
      // voice = pct(5,7)=71 → +1, quality 2 → 0, sessions/child=1.4 → 0, distress 29% → 0, 1 type
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });

    it("sessions per child >= 4 → +3", () => {
      const input = neutralBase();
      input.family_time_sessions = Array.from({ length: 20 }, (_, i) =>
        makeSession({
          child_id: `C${(i % 5) + 1}`,
          quality_rating: 2,
          child_voice_captured: false,
          post_contact_distress: i < 7, // pct(7,20)=35 → no bonus, no penalty
        }),
      );
      // sessions/child = 4.0 → +3, quality 2 → 0, voice 0% → 0, distress 35% → 0, 1 type
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 3);
    });

    it("sessions per child >= 2 and < 4 → +1", () => {
      const input = neutralBase();
      input.family_time_sessions = Array.from({ length: 10 }, (_, i) =>
        makeSession({
          child_id: `C${(i % 5) + 1}`,
          quality_rating: 2,
          child_voice_captured: false,
          post_contact_distress: i < 3, // pct(3,10)=30 → no bonus, no penalty
        }),
      );
      // sessions/child = 2.0 → +1
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });

    it("post-contact distress <= 10% → +2", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
      ];
      // distress = 0% → +2
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 2);
    });

    it("post-contact distress <= 25% and > 10% → +1", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        makeSession({ child_id: "C4", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
      ];
      // pct(1,4)=25 → +1
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });

    it("diverse session types >= 3 → +2", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true, session_type: "face_to_face" }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "video" }),
      ];
      // 3 types → +2
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 2);
    });

    it("diverse session types == 2 → +1", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true, session_type: "face_to_face" }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
      ];
      // 2 types → +1
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 + 1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. INDIVIDUAL PENALTIES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Individual penalties", () => {
    it("contact plan coverage < 50 → -5", () => {
      const input = neutralBase();
      input.contact_plans = [
        makeContactPlan({ child_id: "C1" }),
        makeContactPlan({ child_id: "C2" }),
      ];
      // pct(2,5)=40 → -5
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 5);
    });

    it("parent engagement < 30 → -5", () => {
      const input = neutralBase();
      input.parent_partnership_records = [
        makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
        makeParentPartnership({ child_id: "C2", engagement_level: "low" }),
        makeParentPartnership({ child_id: "C3", engagement_level: "low" }),
        makeParentPartnership({ child_id: "C4", engagement_level: "none" }),
        makeParentPartnership({ child_id: "C5", engagement_level: "none" }),
      ];
      // pct(1,5)=20 → -5
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 5);
    });

    it("post-contact distress > 50% → -5", () => {
      const input = neutralBase();
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
      ];
      // pct(2,3)=67 → -5
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 5);
    });

    it("social worker contact rate < 50 → -3", () => {
      const input = neutralBase();
      input.social_worker_contacts = [
        makeSWContact({ child_id: "C1" }),
        makeSWContact({ child_id: "C2" }),
      ];
      // pct(2,5)=40 → -3
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 3);
    });

    it("multiple penalties stack: coverage<50 + engagement<30 = -10", () => {
      const input = neutralBase();
      input.contact_plans = [
        makeContactPlan({ child_id: "C1" }),
        makeContactPlan({ child_id: "C2" }),
      ];
      input.parent_partnership_records = [
        makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
        makeParentPartnership({ child_id: "C2", engagement_level: "low" }),
        makeParentPartnership({ child_id: "C3", engagement_level: "low" }),
        makeParentPartnership({ child_id: "C4", engagement_level: "none" }),
        makeParentPartnership({ child_id: "C5", engagement_level: "none" }),
      ];
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 5 - 5);
    });

    it("all four penalties stack: -5 -5 -5 -3 = -18", () => {
      const input = neutralBase();
      input.contact_plans = [makeContactPlan({ child_id: "C1" })]; // pct(1,5)=20 < 50 → -5
      input.parent_partnership_records = [
        makeParentPartnership({ engagement_level: "none" }),
        makeParentPartnership({ engagement_level: "none" }),
        makeParentPartnership({ engagement_level: "none" }),
        makeParentPartnership({ engagement_level: "none" }),
      ]; // pct(0,4)=0 < 30 → -5
      input.family_time_sessions = [
        makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
        makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
      ]; // distress pct(2,3)=67 > 50 → -5
      input.social_worker_contacts = [makeSWContact({ child_id: "C1" })]; // pct(1,5)=20 < 50 → -3
      expect(computeFamilySocialConnectivity(input).connectivity_score).toBe(52 - 18);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. COMBINED SCORING FOR OUTSTANDING (~80)
  // ════════════════════════════════════════════════════════════════════════════

  describe("Combined scoring for outstanding", () => {
    it("achieves exactly 80 with all top-tier bonuses", () => {
      // 52 + 4+4+4+3+3+3+3+2+2 = 80
      const children = ["C1", "C2", "C3"];
      const types = ["face_to_face", "phone", "video", "letter"];
      const sessions: FamilyTimeSessionInput[] = [];
      for (const c of children) {
        for (let s = 0; s < 4; s++) {
          sessions.push(makeSession({
            child_id: c, quality_rating: 4 + (s % 2),
            child_voice_captured: true, post_contact_distress: false,
            session_type: types[s],
          }));
        }
      }
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 3, total_staff: 5,
        family_time_sessions: sessions,
        contact_plans: children.map((cid) => makeContactPlan({ child_id: cid })),
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "medium" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "low" }),
        ],
        social_worker_contacts: children.map((cid) => makeSWContact({ child_id: cid })),
        sibling_contact_protocols: children.map((cid) =>
          makeSiblingProtocol({ child_id: cid, contact_maintained: true }),
        ),
      });
      expect(r.connectivity_score).toBe(80);
      expect(r.connectivity_rating).toBe("outstanding");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. RATING BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Rating boundaries", () => {
    it("score exactly 80 yields outstanding", () => {
      const children = ["C1", "C2", "C3"];
      const types = ["face_to_face", "phone", "video", "letter"];
      const sessions: FamilyTimeSessionInput[] = [];
      for (const c of children) {
        for (let s = 0; s < 4; s++) {
          sessions.push(makeSession({
            child_id: c, quality_rating: 4 + (s % 2),
            child_voice_captured: true, post_contact_distress: false,
            session_type: types[s],
          }));
        }
      }
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 3, total_staff: 5,
        family_time_sessions: sessions,
        contact_plans: children.map((cid) => makeContactPlan({ child_id: cid })),
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "medium" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "low" }),
        ],
        social_worker_contacts: children.map((cid) => makeSWContact({ child_id: cid })),
        sibling_contact_protocols: children.map((cid) =>
          makeSiblingProtocol({ child_id: cid, contact_maintained: true }),
        ),
      });
      expect(r.connectivity_score).toBe(80);
      expect(r.connectivity_rating).toBe("outstanding");
    });

    it("score exactly 79 yields good (not outstanding)", () => {
      // From 80 → drop diverse types from >=3 to ==2: -1 → 79
      const children = ["C1", "C2", "C3"];
      const types = ["face_to_face", "phone"];
      const sessions: FamilyTimeSessionInput[] = [];
      for (const c of children) {
        for (let s = 0; s < 4; s++) {
          sessions.push(makeSession({
            child_id: c, quality_rating: 4 + (s % 2),
            child_voice_captured: true, post_contact_distress: false,
            session_type: types[s % 2],
          }));
        }
      }
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 3, total_staff: 5,
        family_time_sessions: sessions,
        contact_plans: children.map((cid) => makeContactPlan({ child_id: cid })),
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "medium" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "low" }),
        ],
        social_worker_contacts: children.map((cid) => makeSWContact({ child_id: cid })),
        sibling_contact_protocols: children.map((cid) =>
          makeSiblingProtocol({ child_id: cid, contact_maintained: true }),
        ),
      });
      expect(r.connectivity_score).toBe(79);
      expect(r.connectivity_rating).toBe("good");
    });

    it("score exactly 65 yields good", () => {
      // 52 + quality +2 + plan +4 + parent +4 + SW +3 = 65
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 3, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ child_id: "C2", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
          makeSession({ child_id: "C3", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [
          makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" }),
          makeContactPlan({ child_id: "C3" }), makeContactPlan({ child_id: "C4" }),
          makeContactPlan({ child_id: "C5" }),
        ],
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C4", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C5", engagement_level: "low" }),
        ],
        social_worker_contacts: [
          makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" }),
          makeSWContact({ child_id: "C3" }), makeSWContact({ child_id: "C4" }),
          makeSWContact({ child_id: "C5" }),
        ],
        sibling_contact_protocols: [
          makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C3", contact_maintained: false }),
        ],
      });
      expect(r.connectivity_score).toBe(65);
      expect(r.connectivity_rating).toBe("good");
    });

    it("score exactly 64 yields adequate (not good)", () => {
      // 52 + quality +2 + plan +4 + parent +4 + SW +1 + sibling +1 = 64
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 3, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ child_id: "C2", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
          makeSession({ child_id: "C3", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [
          makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" }),
          makeContactPlan({ child_id: "C3" }), makeContactPlan({ child_id: "C4" }),
          makeContactPlan({ child_id: "C5" }),
        ],
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C4", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C5", engagement_level: "low" }),
        ],
        social_worker_contacts: [
          makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" }),
          makeSWContact({ child_id: "C3" }), makeSWContact({ child_id: "C4" }),
        ],
        sibling_contact_protocols: [
          makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C3", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C4", contact_maintained: false }),
        ],
      });
      expect(r.connectivity_score).toBe(64);
      expect(r.connectivity_rating).toBe("adequate");
    });

    it("score exactly 45 yields adequate", () => {
      // 52 - plan penalty(-5) - SW penalty(-3) + session type bonus(+1) = 45
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true, session_type: "face_to_face" }),
          makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
          makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" })],
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "medium" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "low" }),
          makeParentPartnership({ child_id: "C4", engagement_level: "none" }),
        ],
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
        sibling_contact_protocols: [
          makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C3", contact_maintained: false }),
        ],
      });
      expect(r.connectivity_score).toBe(45);
      expect(r.connectivity_rating).toBe("adequate");
    });

    it("score exactly 44 yields inadequate (not adequate)", () => {
      // 52 - plan penalty(-5) - SW penalty(-3) = 44 (no type bonus since 1 type)
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
          makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" })],
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "medium" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "low" }),
          makeParentPartnership({ child_id: "C4", engagement_level: "none" }),
        ],
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
        sibling_contact_protocols: [
          makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C3", contact_maintained: false }),
        ],
      });
      expect(r.connectivity_score).toBe(44);
      expect(r.connectivity_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. METRIC CALCULATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Metric calculations", () => {
    it("total_sessions = family_time_sessions.length", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [makeSession(), makeSession(), makeSession()],
      }));
      expect(r.total_sessions).toBe(3);
    });

    it("sessions_per_child rounds to 1 decimal: 7/5 = 1.4", () => {
      const sessions = Array.from({ length: 7 }, () => makeSession());
      const r = computeFamilySocialConnectivity(baseInput({ family_time_sessions: sessions }));
      expect(r.sessions_per_child).toBe(1.4);
    });

    it("sessions_per_child = 0 when total_children = 0 (non-special-case)", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 0, total_staff: 1,
        family_time_sessions: [makeSession()],
        contact_plans: [], parent_partnership_records: [],
        social_worker_contacts: [], sibling_contact_protocols: [],
      });
      expect(r.sessions_per_child).toBe(0);
    });

    it("session_quality_avg rounds to 1 decimal", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ quality_rating: 3 }),
          makeSession({ quality_rating: 4 }),
          makeSession({ quality_rating: 5 }),
        ],
      }));
      expect(r.session_quality_avg).toBe(4);
    });

    it("session_quality_avg = 0 when no sessions", () => {
      const r = computeFamilySocialConnectivity(baseInput({ family_time_sessions: [] }));
      expect(r.session_quality_avg).toBe(0);
    });

    it("contact_plan_coverage uses unique children from active plans", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 4,
        contact_plans: [
          makeContactPlan({ child_id: "C1", status: "active" }),
          makeContactPlan({ child_id: "C2", status: "active" }),
          makeContactPlan({ child_id: "C3", status: "suspended" }),
        ],
      }));
      expect(r.contact_plan_coverage).toBe(50);
    });

    it("contact_plan_coverage counts duplicate child_ids once", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        contact_plans: [
          makeContactPlan({ child_id: "C1" }),
          makeContactPlan({ child_id: "C1" }),
          makeContactPlan({ child_id: "C2" }),
        ],
      }));
      expect(r.contact_plan_coverage).toBe(100);
    });

    it("parent_engagement_rate counts high and medium only", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.parent_engagement_rate).toBe(50);
    });

    it("social_worker_contact_rate uses 42-day threshold and child_seen=true", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 3,
        social_worker_contacts: [
          makeSWContact({ child_id: "C1", contact_date: daysAgo(10), child_seen: true }),
          makeSWContact({ child_id: "C2", contact_date: daysAgo(42), child_seen: true }),
          makeSWContact({ child_id: "C3", contact_date: daysAgo(43), child_seen: true }),
        ],
      }));
      expect(r.social_worker_contact_rate).toBe(67);
    });

    it("social_worker_contact_rate excludes child_seen=false", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        social_worker_contacts: [
          makeSWContact({ child_id: "C1", contact_date: daysAgo(5), child_seen: true }),
          makeSWContact({ child_id: "C2", contact_date: daysAgo(5), child_seen: false }),
        ],
      }));
      expect(r.social_worker_contact_rate).toBe(50);
    });

    it("sibling_contact_compliance only counts active protocols", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ protocol_status: "active", contact_maintained: true }),
          makeSiblingProtocol({ protocol_status: "active", contact_maintained: false }),
          makeSiblingProtocol({ protocol_status: "suspended", contact_maintained: true }),
          makeSiblingProtocol({ protocol_status: "not_applicable", contact_maintained: true }),
        ],
      }));
      expect(r.sibling_contact_compliance).toBe(50);
    });

    it("child_voice_capture_rate = pct(voice, total sessions)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ child_voice_captured: true }),
          makeSession({ child_voice_captured: true }),
          makeSession({ child_voice_captured: false }),
          makeSession({ child_voice_captured: false }),
        ],
      }));
      expect(r.child_voice_capture_rate).toBe(50);
    });

    it("post_contact_distress_rate = pct(distress, total sessions)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true }),
          makeSession({ post_contact_distress: false }),
          makeSession({ post_contact_distress: false }),
          makeSession({ post_contact_distress: false }),
          makeSession({ post_contact_distress: false }),
        ],
      }));
      expect(r.post_contact_distress_rate).toBe(20);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. STRENGTHS GENERATION
  // ════════════════════════════════════════════════════════════════════════════

  describe("Strengths generation", () => {
    it("session quality >= 4.0 strength mentions 'consistently positive'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ quality_rating: 4 }),
          makeSession({ quality_rating: 5 }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("4.5/5") && s.includes("consistently positive"))).toBe(true);
    });

    it("session quality >= 3.0 and < 4.0 strength mentions 'generally positive'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [makeSession({ quality_rating: 3 }), makeSession({ quality_rating: 3 })],
      }));
      expect(r.strengths.some((s) => s.includes("3/5") && s.includes("generally positive"))).toBe(true);
    });

    it("contact plan coverage >= 95% strength mentions 'proactive planning'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 3,
        contact_plans: ["C1", "C2", "C3"].map((cid) => makeContactPlan({ child_id: cid })),
      }));
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("proactive planning"))).toBe(true);
    });

    it("contact plan coverage >= 80% and < 95% strength mentions 'documented contact'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        contact_plans: ["C1", "C2", "C3", "C4"].map((cid) => makeContactPlan({ child_id: cid })),
      }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("documented contact arrangements"))).toBe(true);
    });

    it("parent engagement >= 80% strength mentions 'collaborative working'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "low" }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("collaborative working"))).toBe(true);
    });

    it("parent engagement >= 60% and < 80% strength mentions 'positive partnership'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("positive partnership"))).toBe(true);
    });

    it("SW contact rate 100% strength mentions 'Every child'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
      }));
      expect(r.strengths.some((s) => s.includes("Every child") && s.includes("statutory visiting compliance"))).toBe(true);
    });

    it("SW contact rate >= 80% and < 100% strength mentions 'multi-agency engagement'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        social_worker_contacts: ["C1", "C2", "C3", "C4"].map((cid) => makeSWContact({ child_id: cid })),
      }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("multi-agency engagement"))).toBe(true);
    });

    it("sibling compliance >= 90% strength mentions 'actively maintained'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: Array.from({ length: 10 }, (_, i) =>
          makeSiblingProtocol({ child_id: `C${i}`, contact_maintained: i < 9 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("actively maintained"))).toBe(true);
    });

    it("sibling compliance >= 70% and < 90% strength mentions 'upheld'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: Array.from({ length: 10 }, (_, i) =>
          makeSiblingProtocol({ child_id: `C${i}`, contact_maintained: i < 7 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("upheld"))).toBe(true);
    });

    it("child voice >= 90% strength mentions 'recorded consistently'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: Array.from({ length: 10 }, (_, i) =>
          makeSession({ child_voice_captured: i < 9, quality_rating: 3 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("recorded consistently"))).toBe(true);
    });

    it("child voice >= 70% and < 90% strength mentions 'good practice'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: Array.from({ length: 10 }, (_, i) =>
          makeSession({ child_voice_captured: i < 7, quality_rating: 3 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("good practice"))).toBe(true);
    });

    it("sessions per child >= 4 strength mentions 'frequent, regular family contact'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        family_time_sessions: Array.from({ length: 8 }, (_, i) =>
          makeSession({ child_id: i < 4 ? "C1" : "C2", quality_rating: 3 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("4") && s.includes("frequent, regular family contact"))).toBe(true);
    });

    it("sessions per child >= 2 and < 4 strength mentions 'reasonable'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 3,
        family_time_sessions: Array.from({ length: 6 }, (_, i) =>
          makeSession({ child_id: `C${(i % 3) + 1}`, quality_rating: 3 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("2") && s.includes("reasonable family contact frequency"))).toBe(true);
    });

    it("post-contact distress <= 10% strength mentions 'coping well'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: Array.from({ length: 10 }, () =>
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ),
      }));
      expect(r.strengths.some((s) => s.includes("0%") && s.includes("coping well"))).toBe(true);
    });

    it("diverse session types >= 3 strength mentions 'different formats'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ session_type: "face_to_face", quality_rating: 3 }),
          makeSession({ session_type: "phone", quality_rating: 3 }),
          makeSession({ session_type: "video", quality_rating: 3 }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("3 different formats"))).toBe(true);
    });

    it("positive partnerships >= 70% strength mentions 'constructive relationships'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ partnership_quality: "positive", engagement_level: "high" }),
          makeParentPartnership({ partnership_quality: "positive", engagement_level: "high" }),
          makeParentPartnership({ partnership_quality: "positive", engagement_level: "high" }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("constructive relationships"))).toBe(true);
    });

    it("SW outcome rate >= 90% strength mentions 'excellent documentation'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        social_worker_contacts: [
          makeSWContact({ outcome_recorded: true }),
          makeSWContact({ outcome_recorded: true }),
          makeSWContact({ outcome_recorded: true }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("excellent documentation"))).toBe(true);
    });

    it("no strengths when all metrics are poor", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 2,
        family_time_sessions: [
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1", status: "suspended" })],
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "none", partnership_quality: "hostile" }),
        ],
        social_worker_contacts: [
          makeSWContact({ child_id: "C1", contact_date: daysAgo(100), child_seen: false, outcome_recorded: false }),
        ],
        sibling_contact_protocols: [makeSiblingProtocol({ contact_maintained: false })],
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. CONCERNS GENERATION
  // ════════════════════════════════════════════════════════════════════════════

  describe("Concerns generation", () => {
    it("contact plan coverage < 50% concern mentions 'more than half lack'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        contact_plans: [makeContactPlan({ child_id: "C1" })],
      }));
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("more than half lack"))).toBe(true);
    });

    it("contact plan coverage >= 50% and < 80% concern mentions 'some children'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        contact_plans: ["C1", "C2", "C3"].map((cid) => makeContactPlan({ child_id: cid })),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("some children do not have"))).toBe(true);
    });

    it("parent engagement < 30% concern mentions 'not evidencing'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("not evidencing sufficient work"))).toBe(true);
    });

    it("parent engagement >= 30% and < 60% concern mentions 'fewer than expected'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("fewer than expected families"))).toBe(true);
    });

    it("post-contact distress > 50% concern mentions 'urgent clinical review'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("67%") && c.includes("urgent clinical review"))).toBe(true);
    });

    it("post-contact distress > 25% and <= 50% concern mentions 'significant proportion'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("significant proportion"))).toBe(true);
    });

    it("SW contact rate < 50% concern mentions 'statutory visiting may not be'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
      }));
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("statutory visiting may not be taking place"))).toBe(true);
    });

    it("SW contact rate >= 50% and < 80% concern mentions 'not been seen'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        social_worker_contacts: ["C1", "C2", "C3"].map((cid) => makeSWContact({ child_id: cid })),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("not been seen by their social worker"))).toBe(true);
    });

    it("sibling compliance < 50% concern mentions 'significant risk of breakdown'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("significant risk of breakdown"))).toBe(true);
    });

    it("sibling compliance >= 50% and < 70% concern mentions 'not being maintained'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: true }),
          makeSiblingProtocol({ contact_maintained: true }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("not being maintained as agreed"))).toBe(true);
    });

    it("child voice < 50% concern mentions 'not being recorded consistently'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: true, quality_rating: 3 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("not being recorded consistently"))).toBe(true);
    });

    it("stale plans concern (singular)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "C1", last_reviewed: daysAgo(100) }),
          makeContactPlan({ child_id: "C2", last_reviewed: daysAgo(30) }),
          makeContactPlan({ child_id: "C3", last_reviewed: daysAgo(30) }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 active contact plan has not been reviewed"))).toBe(true);
    });

    it("stale plans concern (plural)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "C1", last_reviewed: daysAgo(100) }),
          makeContactPlan({ child_id: "C2", last_reviewed: daysAgo(100) }),
          makeContactPlan({ child_id: "C3", last_reviewed: daysAgo(30) }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("2 active contact plans have not been reviewed"))).toBe(true);
    });

    it("stale plan with null last_reviewed counts as stale", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "C1", last_reviewed: null }),
          makeContactPlan({ child_id: "C2", last_reviewed: daysAgo(10) }),
          makeContactPlan({ child_id: "C3", last_reviewed: daysAgo(10) }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 active contact plan has not been reviewed"))).toBe(true);
    });

    it("hostile/challenging >= 50% concern", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ partnership_quality: "hostile", engagement_level: "high" }),
          makeParentPartnership({ partnership_quality: "challenging", engagement_level: "high" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("100%") && c.includes("challenging or hostile"))).toBe(true);
    });

    it("no engagement records concern (singular)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 parent partnership record shows no engagement"))).toBe(true);
    });

    it("no engagement records concern (plural)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("2 parent partnership records show no engagement"))).toBe(true);
    });

    it("stale sibling protocols concern (singular)", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ last_contact_date: daysAgo(70), contact_maintained: true }),
          makeSiblingProtocol({ last_contact_date: daysAgo(10), contact_maintained: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 active sibling contact protocol has had no recorded contact in over 60 days"))).toBe(true);
    });

    it("stale sibling protocol with null last_contact_date", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ last_contact_date: null, contact_maintained: true }),
          makeSiblingProtocol({ last_contact_date: daysAgo(10), contact_maintained: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 active sibling contact protocol has had no recorded contact"))).toBe(true);
    });

    it("SW child not seen > 30% concern", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        social_worker_contacts: [
          makeSWContact({ child_seen: false }),
          makeSWContact({ child_seen: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("child was not seen"))).toBe(true);
    });

    it("sessions per child < 1 concern", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3 }), makeSession({ child_id: "C2", quality_rating: 3 })],
      }));
      expect(r.concerns.some((c) => c.includes("0.4 sessions per child"))).toBe(true);
    });

    it("no sessions concern when total_children > 0", () => {
      const r = computeFamilySocialConnectivity(baseInput({ total_children: 3, family_time_sessions: [] }));
      expect(r.concerns.some((c) => c.includes("No family time sessions recorded"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("contact plan < 50% → immediate with Reg 45", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5, contact_plans: [makeContactPlan({ child_id: "C1" })],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("fewer than half"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 45");
    });

    it("contact plan >= 50% and < 80% → soon", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        contact_plans: ["C1", "C2", "C3"].map((cid) => makeContactPlan({ child_id: cid })),
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Increase contact plan coverage"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("distress > 50% → immediate", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("urgent review of family contact"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 45");
    });

    it("distress > 25% and <= 50% → soon", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Review contact arrangements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("parent engagement < 30% → immediate with Reg 45", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("parent engagement strategy"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 45");
    });

    it("parent engagement >= 30% and < 60% → soon with Reg 7", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Increase efforts to engage birth parents"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 7");
    });

    it("SW contact < 50% → immediate with Reg 40", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5, social_worker_contacts: [makeSWContact({ child_id: "C1" })],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Escalate to placing authorities"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 40");
    });

    it("sibling compliance < 50% → immediate", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: true }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Urgently review sibling contact"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("child voice < 50% → soon with Reg 7", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: true, quality_rating: 3 }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Ensure children's views are captured"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 7");
    });

    it("child voice >= 50% and < 70% → planned", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: Array.from({ length: 10 }, (_, i) =>
          makeSession({ child_voice_captured: i < 5, quality_rating: 3 }),
        ),
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Improve child voice capture"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("no sessions → immediate recommendation to begin recording", () => {
      const r = computeFamilySocialConnectivity(baseInput({ total_children: 3, family_time_sessions: [] }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Begin recording all family time"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("sessions per child < 2 but > 0 → planned", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3 }), makeSession({ child_id: "C2", quality_rating: 3 })],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Increase family contact frequency"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("diverse session types < 2 → planned without regulatory_ref", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [makeSession({ session_type: "face_to_face", quality_rating: 3 })],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Diversify family contact formats"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBeUndefined();
    });

    it("suspended protocols → planned", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ protocol_status: "suspended" }),
          makeSiblingProtocol({ protocol_status: "active", contact_maintained: true }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("suspended sibling contact protocol"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("SW outcome rate < 70% → planned with Reg 40", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        social_worker_contacts: [
          makeSWContact({ outcome_recorded: true }),
          makeSWContact({ outcome_recorded: false }),
          makeSWContact({ outcome_recorded: false }),
        ],
      }));
      const rec = r.recommendations.find((x) => x.recommendation.includes("Ensure outcomes are recorded"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("Reg 40");
    });

    it("recommendation ranks are sequential starting at 1", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 2,
        family_time_sessions: [
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1", last_reviewed: daysAgo(100) })],
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "none", partnership_quality: "hostile" }),
          makeParentPartnership({ engagement_level: "none", partnership_quality: "hostile" }),
        ],
        social_worker_contacts: [makeSWContact({ child_id: "C1", child_seen: false, outcome_recorded: false })],
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: false, last_contact_date: daysAgo(70) }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ protocol_status: "suspended" }),
        ],
      });
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 11. INSIGHTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("contact plan coverage < 50% → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5, contact_plans: [makeContactPlan({ child_id: "C1" })],
      }));
      const ins = r.insights.find((i) => i.text.includes("20%") && i.text.includes("Ofsted inspectors"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("distress > 50% → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("67%") && i.text.includes("causing harm"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("parent engagement < 30% → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "low" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("0%") && i.text.includes("placement stability"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("SW contact rate < 50% → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5, social_worker_contacts: [makeSWContact({ child_id: "C1" })],
      }));
      const ins = r.insights.find((i) => i.text.includes("20%") && i.text.includes("regulatory concern"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("sibling compliance < 50% → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: false }),
          makeSiblingProtocol({ contact_maintained: true }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("25%") && i.text.includes("key Ofsted consideration"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("no sessions with children > 0 → critical insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({ total_children: 3, family_time_sessions: [] }));
      const ins = r.insights.find((i) => i.text.includes("No family time sessions are recorded"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("critical");
    });

    it("contact plan coverage >= 95% → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 3,
        contact_plans: ["C1", "C2", "C3"].map((cid) => makeContactPlan({ child_id: cid })),
      }));
      const ins = r.insights.find((i) => i.text.includes("100%") && i.text.includes("proactive and structured"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("parent engagement >= 80% → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "low" }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("80%") && i.text.includes("collaborative working"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("SW contact rate 100% → positive insight with 'excellent'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
      }));
      const ins = r.insights.find((i) => i.text.includes("All children") && i.text.includes("excellent multi-agency"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("SW contact rate >= 80% and < 100% → positive insight with 'follow-up'", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        social_worker_contacts: ["C1", "C2", "C3", "C4"].map((cid) => makeSWContact({ child_id: cid })),
      }));
      const ins = r.insights.find((i) => i.text.includes("80%") && i.text.includes("follow-up is needed"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("sibling compliance >= 90% → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        sibling_contact_protocols: Array.from({ length: 10 }, (_, i) =>
          makeSiblingProtocol({ contact_maintained: i < 9 }),
        ),
      }));
      const ins = r.insights.find((i) => i.text.includes("90%") && i.text.includes("commitment"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("child voice >= 90% → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: Array.from({ length: 10 }, (_, i) =>
          makeSession({ child_voice_captured: i < 9, quality_rating: 3 }),
        ),
      }));
      const ins = r.insights.find((i) => i.text.includes("90%") && i.text.includes("child-centred practice"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("child voice < 50% → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: false, quality_rating: 3 }),
          makeSession({ child_voice_captured: true, quality_rating: 3 }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("33%") && i.text.includes("routinely recorded"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("distress > 25% and <= 50% → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ post_contact_distress: true, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
          makeSession({ post_contact_distress: false, quality_rating: 3 }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("33%") && i.text.includes("warrants monitoring"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("sessions per child >= 4 → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        family_time_sessions: Array.from({ length: 8 }, (_, i) =>
          makeSession({ child_id: i < 4 ? "C1" : "C2", quality_rating: 3 }),
        ),
      }));
      const ins = r.insights.find((i) => i.text.includes("4") && i.text.includes("relationship continuity"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("sessions per child < 1 → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 5,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3 }), makeSession({ child_id: "C2", quality_rating: 3 })],
      }));
      const ins = r.insights.find((i) => i.text.includes("less than 1 per child"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("stale plans → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        contact_plans: [
          makeContactPlan({ child_id: "C1", last_reviewed: daysAgo(100) }),
          makeContactPlan({ child_id: "C2", last_reviewed: daysAgo(30) }),
          makeContactPlan({ child_id: "C3", last_reviewed: daysAgo(30) }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("1 contact plan has not been reviewed"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("no engagement → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }),
          makeParentPartnership({ engagement_level: "none" }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("1 parent partnership record shows no engagement"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("SW outcome rate >= 90% → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        social_worker_contacts: [makeSWContact({ outcome_recorded: true }), makeSWContact({ outcome_recorded: true })],
      }));
      const ins = r.insights.find((i) => i.text.includes("100%") && i.text.includes("purposeful, well-documented"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });

    it("SW outcome rate < 70% → warning insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        social_worker_contacts: [
          makeSWContact({ outcome_recorded: true }),
          makeSWContact({ outcome_recorded: false }),
          makeSWContact({ outcome_recorded: false }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("33%") && i.text.includes("difficult to evidence"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("warning");
    });

    it("diverse session types >= 3 → positive insight", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        family_time_sessions: [
          makeSession({ session_type: "face_to_face", quality_rating: 3 }),
          makeSession({ session_type: "phone", quality_rating: 3 }),
          makeSession({ session_type: "video", quality_rating: 3 }),
        ],
      }));
      const ins = r.insights.find((i) => i.text.includes("3 different formats"));
      expect(ins).toBeDefined();
      expect(ins!.severity).toBe("positive");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 12. HEADLINES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("outstanding headline includes coverage, engagement, quality", () => {
      const children = ["C1", "C2", "C3"];
      const types = ["face_to_face", "phone", "video", "letter"];
      const sessions: FamilyTimeSessionInput[] = [];
      for (const c of children) {
        for (let s = 0; s < 4; s++) {
          sessions.push(makeSession({
            child_id: c, quality_rating: 5, child_voice_captured: true,
            post_contact_distress: false, session_type: types[s],
          }));
        }
      }
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 3, total_staff: 5,
        family_time_sessions: sessions,
        contact_plans: children.map((cid) => makeContactPlan({ child_id: cid })),
        parent_partnership_records: children.map((cid) => makeParentPartnership({ child_id: cid })),
        social_worker_contacts: children.map((cid) => makeSWContact({ child_id: cid })),
        sibling_contact_protocols: children.map((cid) => makeSiblingProtocol({ child_id: cid })),
      });
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("100%");
      expect(r.headline).toContain("5/5");
    });

    it("good headline includes total sessions and child count", () => {
      // Build a "good" scoring input (score 65)
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 3, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ child_id: "C2", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
          makeSession({ child_id: "C3", quality_rating: 3, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: ["C1", "C2", "C3", "C4", "C5"].map((cid) => makeContactPlan({ child_id: cid })),
        parent_partnership_records: [
          makeParentPartnership({ child_id: "C1", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C2", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C3", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C4", engagement_level: "high" }),
          makeParentPartnership({ child_id: "C5", engagement_level: "low" }),
        ],
        social_worker_contacts: ["C1", "C2", "C3", "C4", "C5"].map((cid) => makeSWContact({ child_id: cid })),
        sibling_contact_protocols: [
          makeSiblingProtocol({ child_id: "C1", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C2", contact_maintained: true }),
          makeSiblingProtocol({ child_id: "C3", contact_maintained: false }),
        ],
      });
      expect(r.connectivity_rating).toBe("good");
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("3 sessions");
      expect(r.headline).toContain("5 children");
    });

    it("good headline uses singular 'child' for total_children=1", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 1, total_staff: 3,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3, child_voice_captured: false, post_contact_distress: false })],
        contact_plans: [makeContactPlan({ child_id: "C1" })],
        parent_partnership_records: [makeParentPartnership({ child_id: "C1" })],
        social_worker_contacts: [makeSWContact({ child_id: "C1" })],
        sibling_contact_protocols: [makeSiblingProtocol({ child_id: "C1" })],
      });
      // 52 + 2(quality) + 4(plan100) + 4(parent100) + 3(SW100) + 3(sibling100) + 2(distress0) = 70 → good
      expect(r.connectivity_rating).toBe("good");
      expect(r.headline).toContain("1 child");
      expect(r.headline).not.toContain("children");
    });

    it("adequate headline mentions 'improvements needed'", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true, session_type: "face_to_face" }),
          makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
          makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false, session_type: "phone" }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" })],
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }), makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "low" }), makeParentPartnership({ engagement_level: "none" }),
        ],
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: true }), makeSiblingProtocol({ contact_maintained: true }),
          makeSiblingProtocol({ contact_maintained: false }),
        ],
      });
      expect(r.connectivity_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("improvements needed");
    });

    it("inadequate headline via normal scoring mentions 'significant gaps'", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 3,
        family_time_sessions: [
          makeSession({ child_id: "C1", quality_rating: 2, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ child_id: "C2", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
          makeSession({ child_id: "C3", quality_rating: 2, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" })],
        parent_partnership_records: [
          makeParentPartnership({ engagement_level: "high" }), makeParentPartnership({ engagement_level: "medium" }),
          makeParentPartnership({ engagement_level: "low" }), makeParentPartnership({ engagement_level: "none" }),
        ],
        social_worker_contacts: [makeSWContact({ child_id: "C1" }), makeSWContact({ child_id: "C2" })],
        sibling_contact_protocols: [
          makeSiblingProtocol({ contact_maintained: true }), makeSiblingProtocol({ contact_maintained: true }),
          makeSiblingProtocol({ contact_maintained: false }),
        ],
      });
      expect(r.connectivity_rating).toBe("inadequate");
      expect(r.headline).toContain("Inadequate");
      expect(r.headline).toContain("significant gaps");
    });

    it("insufficient_data headline", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 0, total_staff: 0,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.headline).toContain("Insufficient data");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 13. EDGE CASES
  // ════════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("single record in each array works correctly", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 1, total_staff: 1,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3 })],
        contact_plans: [makeContactPlan({ child_id: "C1" })],
        parent_partnership_records: [makeParentPartnership({ child_id: "C1" })],
        social_worker_contacts: [makeSWContact({ child_id: "C1" })],
        sibling_contact_protocols: [makeSiblingProtocol({ child_id: "C1" })],
      });
      expect(r.connectivity_rating).not.toBe("insufficient_data");
      expect(r.total_sessions).toBe(1);
      expect(r.sessions_per_child).toBe(1);
    });

    it("large data sets compute without error", () => {
      const sessions = Array.from({ length: 500 }, (_, i) =>
        makeSession({ child_id: `C${(i % 20) + 1}`, quality_rating: 3 + (i % 3) }),
      );
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 20, total_staff: 10,
        family_time_sessions: sessions,
        contact_plans: Array.from({ length: 20 }, (_, i) => makeContactPlan({ child_id: `C${i + 1}` })),
        parent_partnership_records: Array.from({ length: 20 }, (_, i) => makeParentPartnership({ child_id: `C${i + 1}` })),
        social_worker_contacts: Array.from({ length: 20 }, (_, i) => makeSWContact({ child_id: `C${i + 1}` })),
        sibling_contact_protocols: Array.from({ length: 20 }, (_, i) => makeSiblingProtocol({ child_id: `C${i + 1}` })),
      });
      expect(r.total_sessions).toBe(500);
      expect(r.sessions_per_child).toBe(25);
      expect(typeof r.connectivity_score).toBe("number");
    });

    it("only family_time_sessions populated triggers pct(0,0)=0 penalties", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 2, total_staff: 2,
        family_time_sessions: [makeSession({ child_id: "C1", quality_rating: 3 }), makeSession({ child_id: "C2", quality_rating: 3 })],
        contact_plans: [], parent_partnership_records: [],
        social_worker_contacts: [], sibling_contact_protocols: [],
      });
      expect(r.connectivity_rating).not.toBe("insufficient_data");
      expect(r.contact_plan_coverage).toBe(0);
      expect(r.parent_engagement_rate).toBe(0);
      expect(r.social_worker_contact_rate).toBe(0);
      expect(r.sibling_contact_compliance).toBe(0);
    });

    it("only contact_plans populated has correct coverage", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 2, total_staff: 2,
        family_time_sessions: [],
        contact_plans: [makeContactPlan({ child_id: "C1" }), makeContactPlan({ child_id: "C2" })],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.contact_plan_coverage).toBe(100);
      expect(r.total_sessions).toBe(0);
    });

    it("pct(0,0)=0 for empty parent_partnership_records", () => {
      const r = computeFamilySocialConnectivity(baseInput({ parent_partnership_records: [] }));
      expect(r.parent_engagement_rate).toBe(0);
    });

    it("pct(0,0)=0 for empty sibling_contact_protocols", () => {
      const r = computeFamilySocialConnectivity(baseInput({ sibling_contact_protocols: [] }));
      expect(r.sibling_contact_compliance).toBe(0);
    });

    it("pct(0,0)=0 for empty family_time_sessions metrics", () => {
      const r = computeFamilySocialConnectivity(baseInput({ family_time_sessions: [] }));
      expect(r.child_voice_capture_rate).toBe(0);
      expect(r.post_contact_distress_rate).toBe(0);
      expect(r.session_quality_avg).toBe(0);
    });

    it("score clamped to max 100", () => {
      const r = computeFamilySocialConnectivity(baseInput());
      expect(r.connectivity_score).toBeLessThanOrEqual(100);
    });

    it("score clamped to min 0", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 10, total_staff: 2,
        family_time_sessions: [
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true }),
          makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: false }),
        ],
        contact_plans: [],
        parent_partnership_records: [makeParentPartnership({ engagement_level: "none" })],
        social_worker_contacts: [],
        sibling_contact_protocols: [makeSiblingProtocol({ contact_maintained: false })],
      });
      expect(r.connectivity_score).toBeGreaterThanOrEqual(0);
    });

    it("SW contact exactly at 42-day boundary is counted", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 1,
        social_worker_contacts: [makeSWContact({ child_id: "C1", contact_date: daysAgo(42), child_seen: true })],
      }));
      expect(r.social_worker_contact_rate).toBe(100);
    });

    it("SW contact at 43 days is NOT counted", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 1,
        social_worker_contacts: [makeSWContact({ child_id: "C1", contact_date: daysAgo(43), child_seen: true })],
      }));
      expect(r.social_worker_contact_rate).toBe(0);
    });

    it("duplicate child_ids in SW contacts count as one child", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 2,
        social_worker_contacts: [
          makeSWContact({ child_id: "C1", contact_date: daysAgo(5), child_seen: true }),
          makeSWContact({ child_id: "C1", contact_date: daysAgo(10), child_seen: true }),
          makeSWContact({ child_id: "C2", contact_date: daysAgo(5), child_seen: true }),
        ],
      }));
      expect(r.social_worker_contact_rate).toBe(100);
    });

    it("suspended and under_review plans are not counted for coverage", () => {
      const r = computeFamilySocialConnectivity(baseInput({
        total_children: 3,
        contact_plans: [
          makeContactPlan({ child_id: "C1", status: "active" }),
          makeContactPlan({ child_id: "C2", status: "suspended" }),
          makeContactPlan({ child_id: "C3", status: "under_review" }),
        ],
      }));
      expect(r.contact_plan_coverage).toBe(33);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 14. RETURN STRUCTURE
  // ════════════════════════════════════════════════════════════════════════════

  describe("Return structure", () => {
    it("all required fields are present with correct types", () => {
      const r = computeFamilySocialConnectivity(baseInput());
      expect(typeof r.connectivity_rating).toBe("string");
      expect(typeof r.connectivity_score).toBe("number");
      expect(typeof r.headline).toBe("string");
      expect(typeof r.total_sessions).toBe("number");
      expect(typeof r.sessions_per_child).toBe("number");
      expect(typeof r.session_quality_avg).toBe("number");
      expect(typeof r.contact_plan_coverage).toBe("number");
      expect(typeof r.parent_engagement_rate).toBe("number");
      expect(typeof r.social_worker_contact_rate).toBe("number");
      expect(typeof r.sibling_contact_compliance).toBe("number");
      expect(typeof r.child_voice_capture_rate).toBe("number");
      expect(typeof r.post_contact_distress_rate).toBe("number");
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("rating is one of the expected values", () => {
      const r = computeFamilySocialConnectivity(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.connectivity_rating);
    });

    it("recommendations have rank, recommendation, urgency fields", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 2,
        family_time_sessions: [makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true })],
        contact_plans: [], parent_partnership_records: [makeParentPartnership({ engagement_level: "none" })],
        social_worker_contacts: [], sibling_contact_protocols: [],
      });
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (const rec of r.recommendations) {
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        if (rec.regulatory_ref !== undefined) {
          expect(typeof rec.regulatory_ref).toBe("string");
        }
      }
    });

    it("insights have text and severity fields", () => {
      const r = computeFamilySocialConnectivity(baseInput());
      for (const ins of r.insights) {
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });

    it("strengths are all strings", () => {
      const r = computeFamilySocialConnectivity(baseInput());
      for (const s of r.strengths) {
        expect(typeof s).toBe("string");
      }
    });

    it("concerns are all strings", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 5, total_staff: 2,
        family_time_sessions: [makeSession({ quality_rating: 1, child_voice_captured: false, post_contact_distress: true })],
        contact_plans: [], parent_partnership_records: [makeParentPartnership({ engagement_level: "none" })],
        social_worker_contacts: [], sibling_contact_protocols: [],
      });
      expect(r.concerns.length).toBeGreaterThan(0);
      for (const c of r.concerns) {
        expect(typeof c).toBe("string");
      }
    });

    it("insufficient_data returns all empty arrays", () => {
      const r = computeFamilySocialConnectivity({
        today: TODAY, total_children: 0, total_staff: 0,
        family_time_sessions: [], contact_plans: [],
        parent_partnership_records: [], social_worker_contacts: [],
        sibling_contact_protocols: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
      expect(r.connectivity_score).toBe(0);
    });
  });
});
