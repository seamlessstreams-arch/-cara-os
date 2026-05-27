import { describe, it, expect } from "vitest";
import {
  computeHomeCommunityAccess,
  type HomeCommunityAccessInput,
  type TransportLogInput,
  type TransportRAInput,
  type IndependentTravelInput,
  type TripPlanInput,
  type CommunityEngagementInput,
} from "../home-community-access-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function daysAgo(n: number): string {
  const d = new Date("2026-05-27");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function futureDate(n: number): string {
  const d = new Date("2026-05-27");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makeTransportLog(overrides: Partial<TransportLogInput> = {}): TransportLogInput {
  return {
    id: `tl_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(5),
    driver_licence_checked: true,
    vehicle_checked: true,
    incident_during_journey: false,
    behaviour_during_journey: "excellent",
    passengers: [{ child_id: "c1" }],
    ...overrides,
  };
}

function makeTransportRA(overrides: Partial<TransportRAInput> = {}): TransportRAInput {
  return {
    id: `ra_${Math.random().toString(36).slice(2, 8)}`,
    signedOffByRM: true,
    hazards: [{ description: "Speed bumps" }, { description: "Busy junction" }],
    emergencyProcedure: "Call 999, notify manager on call",
    breakdownProcedure: "Pull over safely, call breakdown service",
    nextReviewDate: futureDate(30),
    inUseStatus: true,
    ...overrides,
  };
}

function makeIndependentTravel(overrides: Partial<IndependentTravelInput> = {}): IndependentTravelInput {
  return {
    id: `it_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "c1",
    current_stage: "stage_3_solo_familiar",
    routes_mastered: [{ route: "Home to school" }, { route: "Home to shops" }, { route: "Home to park" }],
    child_confidence: "confident",
    child_voice: "I feel safe on the bus now",
    review_date: futureDate(30),
    ...overrides,
  };
}

function makeTripPlan(overrides: Partial<TripPlanInput> = {}): TripPlanInput {
  return {
    id: `tp_${Math.random().toString(36).slice(2, 8)}`,
    start_date: daysAgo(10),
    manager_approval: true,
    social_worker_approval: [{ approved: true }],
    risk_assessment: { completed: true },
    children_views: "The children were excited about this trip",
    post_trip_evaluation: { completed: true },
    young_people: [{ child_id: "c1" }],
    status: "completed",
    ...overrides,
  };
}

function makeCommunityEngagement(overrides: Partial<CommunityEngagementInput> = {}): CommunityEngagementInput {
  return {
    id: `ce_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(10),
    young_people: ["c1", "c2"],
    activity_type: "volunteering",
    outcomes: ["Built confidence", "Made new connections"],
    child_feedback: "Really enjoyed helping out",
    builds_connections: true,
    ongoing_commitment: true,
    ...overrides,
  };
}

/**
 * baseInput produces score = 80 (outstanding)
 * 52 base + 5 (mod1) + 4 (mod2) + 3 (mod3) + 4 (mod4) + 3 (mod5) + 3 (mod6) + 3 (mod7) + 3 (mod8) = 80
 */
function baseInput(overrides: Partial<HomeCommunityAccessInput> = {}): HomeCommunityAccessInput {
  return {
    today: TODAY,
    transport_logs: [
      makeTransportLog({ id: "tl1" }),
      makeTransportLog({ id: "tl2" }),
      makeTransportLog({ id: "tl3" }),
      makeTransportLog({ id: "tl4" }),
      makeTransportLog({ id: "tl5" }),
      makeTransportLog({ id: "tl6" }),
      makeTransportLog({ id: "tl7" }),
      makeTransportLog({ id: "tl8" }),
      makeTransportLog({ id: "tl9" }),
      makeTransportLog({ id: "tl10" }),
    ],
    transport_ras: [
      makeTransportRA({ id: "ra1" }),
      makeTransportRA({ id: "ra2" }),
      makeTransportRA({ id: "ra3" }),
      makeTransportRA({ id: "ra4" }),
      makeTransportRA({ id: "ra5" }),
    ],
    independent_travel_records: [
      makeIndependentTravel({ id: "it1", child_id: "c1" }),
      makeIndependentTravel({ id: "it2", child_id: "c2" }),
      makeIndependentTravel({ id: "it3", child_id: "c3" }),
      makeIndependentTravel({ id: "it4", child_id: "c4" }),
      makeIndependentTravel({ id: "it5", child_id: "c5" }),
    ],
    trip_plans: [
      makeTripPlan({ id: "tp1" }),
      makeTripPlan({ id: "tp2" }),
      makeTripPlan({ id: "tp3" }),
      makeTripPlan({ id: "tp4" }),
      makeTripPlan({ id: "tp5" }),
    ],
    community_engagements: [
      makeCommunityEngagement({ id: "ce1", date: daysAgo(5) }),
      makeCommunityEngagement({ id: "ce2", date: daysAgo(10) }),
      makeCommunityEngagement({ id: "ce3", date: daysAgo(15) }),
      makeCommunityEngagement({ id: "ce4", date: daysAgo(20) }),
      makeCommunityEngagement({ id: "ce5", date: daysAgo(25) }),
      makeCommunityEngagement({ id: "ce6", date: daysAgo(30) }),
      makeCommunityEngagement({ id: "ce7", date: daysAgo(35) }),
      makeCommunityEngagement({ id: "ce8", date: daysAgo(40) }),
      makeCommunityEngagement({ id: "ce9", date: daysAgo(50) }),
      makeCommunityEngagement({ id: "ce10", date: daysAgo(60) }),
    ],
    total_children: 5,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHomeCommunityAccess", () => {
  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no data at all", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY, transport_logs: [], transport_ras: [],
        independent_travel_records: [], trip_plans: [],
        community_engagements: [], total_children: 0,
      });
      expect(r.community_access_rating).toBe("insufficient_data");
      expect(r.community_access_score).toBe(0);
    });

    it("returns empty arrays for narrative on insufficient data", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY, transport_logs: [], transport_ras: [],
        independent_travel_records: [], trip_plans: [],
        community_engagements: [], total_children: 0,
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("does NOT return insufficient_data when total_children > 0", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY, transport_logs: [], transport_ras: [],
        independent_travel_records: [], trip_plans: [],
        community_engagements: [], total_children: 3,
      });
      expect(r.community_access_rating).not.toBe("insufficient_data");
    });

    it("returns correct headline on insufficient data", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY, transport_logs: [], transport_ras: [],
        independent_travel_records: [], trip_plans: [],
        community_engagements: [], total_children: 0,
      });
      expect(r.headline).toContain("No community access data");
    });
  });

  // ── Base score / outstanding ──────────────────────────────────────
  describe("base score and outstanding rating", () => {
    it("baseInput scores 80 — outstanding", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.community_access_score).toBe(80);
      expect(r.community_access_rating).toBe("outstanding");
    });

    it("headline reflects outstanding rating", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.headline).toContain("outstanding");
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("score >= 80 is outstanding", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.community_access_score).toBeGreaterThanOrEqual(80);
      expect(r.community_access_rating).toBe("outstanding");
    });

    it("score 65-79 is good", () => {
      // Degrade mod1 and mod2 to lose points
      const r = computeHomeCommunityAccess(baseInput({
        transport_logs: [
          makeTransportLog({ driver_licence_checked: false, vehicle_checked: false, behaviour_during_journey: "challenging" }),
          makeTransportLog({ driver_licence_checked: false, vehicle_checked: false, behaviour_during_journey: "challenging" }),
        ],
        transport_ras: [],
      }));
      expect(r.community_access_score).toBeGreaterThanOrEqual(65);
      expect(r.community_access_score).toBeLessThan(80);
      expect(r.community_access_rating).toBe("good");
    });

    it("score 45-64 is adequate", () => {
      // Degrade enough domains to land in adequate range (45-64)
      const r = computeHomeCommunityAccess(baseInput({
        transport_logs: [
          makeTransportLog({ id: "tl1", driver_licence_checked: false, vehicle_checked: false, behaviour_during_journey: "challenging" }),
          makeTransportLog({ id: "tl2", driver_licence_checked: false, vehicle_checked: false, behaviour_during_journey: "challenging" }),
        ],
        transport_ras: [
          makeTransportRA({ id: "ra1", signedOffByRM: false, hazards: [], emergencyProcedure: "", breakdownProcedure: "" }),
        ],
        community_engagements: [
          makeCommunityEngagement({ id: "ce1", date: daysAgo(5), builds_connections: false, ongoing_commitment: false, outcomes: [], child_feedback: "" }),
        ],
      }));
      expect(r.community_access_score).toBeGreaterThanOrEqual(45);
      expect(r.community_access_score).toBeLessThan(65);
      expect(r.community_access_rating).toBe("adequate");
    });

    it("score < 45 is inadequate", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY,
        transport_logs: [],
        transport_ras: [],
        independent_travel_records: [],
        trip_plans: [],
        community_engagements: [],
        total_children: 5,
      });
      expect(r.community_access_score).toBeLessThan(45);
      expect(r.community_access_rating).toBe("inadequate");
    });
  });

  // ── Mod 1: Transport Safety & Compliance ──────────────────────────
  describe("Mod 1: Transport Safety & Compliance", () => {
    it("+5 with perfect licence, vehicle, zero incidents, excellent behaviour", () => {
      const r = computeHomeCommunityAccess(baseInput());
      // baseInput has all perfect transport logs
      expect(r.community_access_score).toBe(80);
    });

    it("penalises low licence check rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, driver_licence_checked: i < 3 }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low vehicle check rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, vehicle_checked: i < 3 }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises high incident rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, incident_during_journey: i < 5 }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises poor behaviour quality", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, behaviour_during_journey: "incident_logged" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises no transport logs with children", () => {
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: [] }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 2: Transport Risk Assessment Quality ──────────────────────
  describe("Mod 2: Transport RA Quality", () => {
    it("+4 with all signed off, good hazards, procedures, no overdue", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.transport_ra.signed_off_rate).toBe(100);
      expect(r.transport_ra.overdue_reviews).toBe(0);
    });

    it("penalises low sign-off rate", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, signedOffByRM: false }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low hazard documentation", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, hazards: [] }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing emergency procedures", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, emergencyProcedure: "", breakdownProcedure: "" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises overdue reviews", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, nextReviewDate: daysAgo(10) }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises no transport RAs with children", () => {
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: [] }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 3: Independent Travel Development ─────────────────────────
  describe("Mod 3: Independent Travel Development", () => {
    it("+3 with full coverage, solo stages, confident children", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.independent_travel.child_coverage).toBe(100);
      expect(r.independent_travel.solo_or_independent_rate).toBe(100);
    });

    it("penalises low child coverage", () => {
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.child_coverage).toBe(20);
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low solo/independent rate", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, current_stage: "stage_1_accompanied" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.solo_or_independent_rate).toBe(0);
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low confidence levels", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, child_confidence: "anxious" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.confident_or_highly_rate).toBe(0);
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises no records with children", () => {
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: [] }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 4: Trip Planning & Quality ────────────────────────────────
  describe("Mod 4: Trip Planning & Quality", () => {
    it("+4 with full approvals, RA, views, post-eval", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.trip_planning.manager_approval_rate).toBe(100);
      expect(r.trip_planning.risk_assessment_rate).toBe(100);
    });

    it("penalises low manager approval", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, manager_approval: false }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing risk assessments", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, risk_assessment: null }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing children's views", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, children_views: "" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing post-trip evaluations", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, post_trip_evaluation: null }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("excludes cancelled trips from approval calculations", () => {
      const trips = [
        makeTripPlan({ id: "tp1", manager_approval: false, status: "cancelled" }),
        makeTripPlan({ id: "tp2", manager_approval: true }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.manager_approval_rate).toBe(100);
    });

    it("penalises no trips with children", () => {
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: [] }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 5: Community Engagement Breadth ───────────────────────────
  describe("Mod 5: Community Engagement Breadth", () => {
    it("+3 with frequent, connection-building, ongoing engagements", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.community_engagement.total_engagements_90d).toBeGreaterThanOrEqual(10);
      expect(r.community_engagement.builds_connections_rate).toBe(100);
    });

    it("penalises low engagement frequency", () => {
      const engagements = [
        makeCommunityEngagement({ id: "ce1", date: daysAgo(10) }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low builds_connections rate", () => {
      const engagements = Array.from({ length: 10 }, (_, i) =>
        makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(i * 5 + 1), builds_connections: false }),
      );
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises low ongoing_commitment rate", () => {
      const engagements = Array.from({ length: 10 }, (_, i) =>
        makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(i * 5 + 1), ongoing_commitment: false }),
      );
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("excludes engagements older than 90 days", () => {
      const engagements = Array.from({ length: 10 }, (_, i) =>
        makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(100 + i) }),
      );
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_engagement.total_engagements_90d).toBe(0);
    });

    it("penalises no engagements with children", () => {
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: [] }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 6: Child Voice Across Community Access ────────────────────
  describe("Mod 6: Child Voice", () => {
    it("+3 with strong voice across all sources", () => {
      const r = computeHomeCommunityAccess(baseInput());
      // baseInput has child_voice, children_views, and child_feedback everywhere
      expect(r.community_access_score).toBe(80);
    });

    it("penalises missing child voice in travel records", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, child_voice: "" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing child feedback in community engagements", () => {
      const engagements = Array.from({ length: 10 }, (_, i) =>
        makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(i * 5 + 1), child_feedback: "" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing children's views in trips", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, children_views: "" }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Mod 7: Review Compliance ──────────────────────────────────────
  describe("Mod 7: Review Compliance", () => {
    it("+3 with zero overdue reviews", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.independent_travel.overdue_reviews).toBe(0);
      expect(r.transport_ra.overdue_reviews).toBe(0);
    });

    it("penalises overdue travel record reviews", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, review_date: daysAgo(10) }),
      );
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises overdue transport RA reviews", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, nextReviewDate: daysAgo(10) }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("scores +1 with 1-2 overdue vs +3 with zero", () => {
      const r0 = computeHomeCommunityAccess(baseInput());
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1", review_date: daysAgo(5) }),
        makeIndependentTravel({ id: "it2", child_id: "c2" }),
        makeIndependentTravel({ id: "it3", child_id: "c3" }),
        makeIndependentTravel({ id: "it4", child_id: "c4" }),
        makeIndependentTravel({ id: "it5", child_id: "c5" }),
      ];
      const r1 = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r0.community_access_score).toBeGreaterThan(r1.community_access_score);
    });
  });

  // ── Mod 8: Outcome Documentation ──────────────────────────────────
  describe("Mod 8: Outcome Documentation", () => {
    it("+3 with outcomes, evaluations, and routes documented", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.community_access_score).toBe(80);
    });

    it("penalises missing outcomes in community engagements", () => {
      const engagements = Array.from({ length: 10 }, (_, i) =>
        makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(i * 5 + 1), outcomes: [] }),
      );
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises missing post-trip evaluations in completed trips", () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        makeTripPlan({ id: `tp${i}`, post_trip_evaluation: null }),
      );
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.community_access_score).toBeLessThan(80);
    });

    it("penalises no routes mastered in travel records", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, routes_mastered: [] }),
      );
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.community_access_score).toBeLessThan(80);
    });
  });

  // ── Transport Safety Summary ──────────────────────────────────────
  describe("Transport Safety Summary", () => {
    it("computes licence checked rate correctly", () => {
      const logs = [
        makeTransportLog({ id: "tl1", driver_licence_checked: true }),
        makeTransportLog({ id: "tl2", driver_licence_checked: false }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.transport_safety.licence_checked_rate).toBe(50);
    });

    it("computes incident rate correctly", () => {
      const logs = [
        makeTransportLog({ id: "tl1", incident_during_journey: true }),
        makeTransportLog({ id: "tl2", incident_during_journey: false }),
        makeTransportLog({ id: "tl3", incident_during_journey: false }),
        makeTransportLog({ id: "tl4", incident_during_journey: false }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.transport_safety.incident_rate).toBe(25);
    });

    it("computes excellent behaviour rate (includes good)", () => {
      const logs = [
        makeTransportLog({ id: "tl1", behaviour_during_journey: "excellent" }),
        makeTransportLog({ id: "tl2", behaviour_during_journey: "good" }),
        makeTransportLog({ id: "tl3", behaviour_during_journey: "challenging" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.transport_safety.excellent_behaviour_rate).toBe(67);
    });
  });

  // ── Transport RA Summary ──────────────────────────────────────────
  describe("Transport RA Summary", () => {
    it("counts active RAs", () => {
      const ras = [
        makeTransportRA({ id: "ra1", inUseStatus: true }),
        makeTransportRA({ id: "ra2", inUseStatus: false }),
        makeTransportRA({ id: "ra3", inUseStatus: true }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.transport_ra.active_ras).toBe(2);
    });

    it("computes avg hazards documented", () => {
      const ras = [
        makeTransportRA({ id: "ra1", hazards: [{ description: "A" }, { description: "B" }] }),
        makeTransportRA({ id: "ra2", hazards: [{ description: "C" }] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.transport_ra.avg_hazards_documented).toBe(1.5);
    });

    it("counts overdue reviews correctly", () => {
      const ras = [
        makeTransportRA({ id: "ra1", nextReviewDate: daysAgo(5) }),
        makeTransportRA({ id: "ra2", nextReviewDate: futureDate(10) }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.transport_ra.overdue_reviews).toBe(1);
    });
  });

  // ── Independent Travel Summary ────────────────────────────────────
  describe("Independent Travel Summary", () => {
    it("computes child coverage", () => {
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1" }),
        makeIndependentTravel({ id: "it2", child_id: "c2" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.child_coverage).toBe(40);
    });

    it("counts solo/independent stages correctly", () => {
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1", current_stage: "stage_3_solo_familiar" }),
        makeIndependentTravel({ id: "it2", child_id: "c2", current_stage: "stage_4_solo_new" }),
        makeIndependentTravel({ id: "it3", child_id: "c3", current_stage: "independent_traveller" }),
        makeIndependentTravel({ id: "it4", child_id: "c4", current_stage: "stage_1_accompanied" }),
        makeIndependentTravel({ id: "it5", child_id: "c5", current_stage: "stage_2_staff_shadowing" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.solo_or_independent_rate).toBe(60);
    });

    it("computes avg routes mastered", () => {
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1", routes_mastered: [{ route: "A" }, { route: "B" }] }),
        makeIndependentTravel({ id: "it2", child_id: "c2", routes_mastered: [{ route: "C" }] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.avg_routes_mastered).toBe(1.5);
    });

    it("counts confident/highly_confident correctly", () => {
      const records = [
        makeIndependentTravel({ id: "it1", child_id: "c1", child_confidence: "confident" }),
        makeIndependentTravel({ id: "it2", child_id: "c2", child_confidence: "highly_confident" }),
        makeIndependentTravel({ id: "it3", child_id: "c3", child_confidence: "anxious" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ independent_travel_records: records }));
      expect(r.independent_travel.confident_or_highly_rate).toBe(67);
    });
  });

  // ── Trip Planning Summary ─────────────────────────────────────────
  describe("Trip Planning Summary", () => {
    it("computes manager approval rate on non-cancelled trips", () => {
      const trips = [
        makeTripPlan({ id: "tp1", manager_approval: true, status: "completed" }),
        makeTripPlan({ id: "tp2", manager_approval: false, status: "approved" }),
        makeTripPlan({ id: "tp3", manager_approval: false, status: "cancelled" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.manager_approval_rate).toBe(50);
    });

    it("computes social worker approval rate", () => {
      const trips = [
        makeTripPlan({ id: "tp1", social_worker_approval: [{ approved: true }] }),
        makeTripPlan({ id: "tp2", social_worker_approval: [{ approved: false }] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.sw_approval_rate).toBe(50);
    });

    it("computes post-trip evaluation rate only on completed trips", () => {
      const trips = [
        makeTripPlan({ id: "tp1", status: "completed", post_trip_evaluation: { completed: true } }),
        makeTripPlan({ id: "tp2", status: "completed", post_trip_evaluation: null }),
        makeTripPlan({ id: "tp3", status: "approved", post_trip_evaluation: null }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.post_trip_evaluation_rate).toBe(50);
    });

    it("counts completed trips", () => {
      const trips = [
        makeTripPlan({ id: "tp1", status: "completed" }),
        makeTripPlan({ id: "tp2", status: "completed" }),
        makeTripPlan({ id: "tp3", status: "approved" }),
        makeTripPlan({ id: "tp4", status: "cancelled" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.completed_trips).toBe(2);
    });
  });

  // ── Community Engagement Summary ──────────────────────────────────
  describe("Community Engagement Summary", () => {
    it("filters to 90-day window", () => {
      const engagements = [
        makeCommunityEngagement({ id: "ce1", date: daysAgo(10) }),
        makeCommunityEngagement({ id: "ce2", date: daysAgo(89) }),
        makeCommunityEngagement({ id: "ce3", date: daysAgo(91) }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_engagement.total_engagements_90d).toBe(2);
    });

    it("counts unique children in engagements", () => {
      const engagements = [
        makeCommunityEngagement({ id: "ce1", date: daysAgo(5), young_people: ["c1", "c2"] }),
        makeCommunityEngagement({ id: "ce2", date: daysAgo(10), young_people: ["c2", "c3"] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_engagement.unique_children_90d).toBe(3);
    });

    it("computes child coverage", () => {
      const engagements = [
        makeCommunityEngagement({ id: "ce1", date: daysAgo(5), young_people: ["c1", "c2", "c3"] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements, total_children: 5 }));
      expect(r.community_engagement.child_coverage_90d).toBe(60);
    });

    it("counts unique activity types", () => {
      const engagements = [
        makeCommunityEngagement({ id: "ce1", date: daysAgo(5), activity_type: "volunteering" }),
        makeCommunityEngagement({ id: "ce2", date: daysAgo(10), activity_type: "sport" }),
        makeCommunityEngagement({ id: "ce3", date: daysAgo(15), activity_type: "volunteering" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: engagements }));
      expect(r.community_engagement.unique_activity_types).toBe(2);
    });
  });

  // ── Strengths / Concerns / Recommendations / Insights ─────────────
  describe("Narrative output", () => {
    it("generates transport safety strength for perfect compliance", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.strengths.some(s => s.includes("transport compliance"))).toBe(true);
    });

    it("generates zero incidents strength", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.strengths.some(s => s.includes("Zero incidents"))).toBe(true);
    });

    it("generates concern for low licence check rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, driver_licence_checked: i < 3 }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.concerns.some(c => c.includes("licence check rate"))).toBe(true);
    });

    it("generates concern for high incident rate", () => {
      const logs = Array.from({ length: 10 }, (_, i) =>
        makeTransportLog({ id: `tl${i}`, incident_during_journey: i < 5 }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: logs }));
      expect(r.concerns.some(c => c.includes("incident rate"))).toBe(true);
    });

    it("generates concern for no transport logs", () => {
      const r = computeHomeCommunityAccess(baseInput({ transport_logs: [] }));
      expect(r.concerns.some(c => c.includes("No transport logs"))).toBe(true);
    });

    it("generates concern for overdue transport RAs", () => {
      const ras = Array.from({ length: 5 }, (_, i) =>
        makeTransportRA({ id: `ra${i}`, nextReviewDate: daysAgo(10) }),
      );
      const r = computeHomeCommunityAccess(baseInput({ transport_ras: ras }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("generates concern for no community engagements", () => {
      const r = computeHomeCommunityAccess(baseInput({ community_engagements: [] }));
      expect(r.concerns.some(c => c.includes("No community engagements"))).toBe(true);
    });

    it("generates recommendations for critical issues", () => {
      const r = computeHomeCommunityAccess(baseInput({
        transport_logs: [],
        transport_ras: [],
        independent_travel_records: [],
        trip_plans: [],
        community_engagements: [],
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations.every(rec => rec.rank > 0)).toBe(true);
    });

    it("generates outstanding insight for outstanding rating", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates inadequate insight for inadequate rating", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY,
        transport_logs: [],
        transport_ras: [],
        independent_travel_records: [],
        trip_plans: [],
        community_engagements: [],
        total_children: 5,
      });
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("inadequate"))).toBe(true);
    });

    it("generates transport safety insight for exemplary practice", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.insights.some(i => i.text.includes("exemplary safety"))).toBe(true);
    });

    it("generates independent travel insight for strong development", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.insights.some(i => i.text.includes("independent travel skills"))).toBe(true);
    });

    it("generates community engagement insight for sustained connections", () => {
      const r = computeHomeCommunityAccess(baseInput());
      expect(r.insights.some(i => i.text.includes("sustained connections"))).toBe(true);
    });
  });

  // ── pct helper via engine behaviour ───────────────────────────────
  describe("pct helper behaviour", () => {
    it("returns 0 when denominator is 0", () => {
      const r = computeHomeCommunityAccess({
        today: TODAY, transport_logs: [], transport_ras: [],
        independent_travel_records: [], trip_plans: [],
        community_engagements: [], total_children: 0,
      });
      expect(r.transport_safety.licence_checked_rate).toBe(0);
      expect(r.transport_safety.vehicle_checked_rate).toBe(0);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("score is clamped to 0-100", () => {
      // All negative modifiers
      const r = computeHomeCommunityAccess({
        today: TODAY,
        transport_logs: Array.from({ length: 10 }, (_, i) =>
          makeTransportLog({ id: `tl${i}`, driver_licence_checked: false, vehicle_checked: false, incident_during_journey: true, behaviour_during_journey: "incident_logged" }),
        ),
        transport_ras: Array.from({ length: 5 }, (_, i) =>
          makeTransportRA({ id: `ra${i}`, signedOffByRM: false, hazards: [], emergencyProcedure: "", breakdownProcedure: "", nextReviewDate: daysAgo(30) }),
        ),
        independent_travel_records: Array.from({ length: 5 }, (_, i) =>
          makeIndependentTravel({ id: `it${i}`, child_id: `c${i + 1}`, current_stage: "stage_1_accompanied", child_confidence: "anxious", child_voice: "", routes_mastered: [], review_date: daysAgo(30) }),
        ),
        trip_plans: Array.from({ length: 5 }, (_, i) =>
          makeTripPlan({ id: `tp${i}`, manager_approval: false, risk_assessment: null, children_views: "", post_trip_evaluation: null }),
        ),
        community_engagements: Array.from({ length: 10 }, (_, i) =>
          makeCommunityEngagement({ id: `ce${i}`, date: daysAgo(i * 5 + 1), builds_connections: false, ongoing_commitment: false, outcomes: [], child_feedback: "" }),
        ),
        total_children: 5,
      });
      expect(r.community_access_score).toBeGreaterThanOrEqual(0);
      expect(r.community_access_score).toBeLessThanOrEqual(100);
    });

    it("handles single transport log", () => {
      const r = computeHomeCommunityAccess(baseInput({
        transport_logs: [makeTransportLog({ id: "tl1" })],
      }));
      expect(r.transport_safety.total_logs).toBe(1);
    });

    it("handles empty social worker approvals in trips", () => {
      const trips = [
        makeTripPlan({ id: "tp1", social_worker_approval: [] }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.sw_approval_rate).toBe(0);
    });

    it("handles only cancelled trips", () => {
      const trips = [
        makeTripPlan({ id: "tp1", status: "cancelled" }),
        makeTripPlan({ id: "tp2", status: "cancelled" }),
      ];
      const r = computeHomeCommunityAccess(baseInput({ trip_plans: trips }));
      expect(r.trip_planning.manager_approval_rate).toBe(0);
    });
  });
});
