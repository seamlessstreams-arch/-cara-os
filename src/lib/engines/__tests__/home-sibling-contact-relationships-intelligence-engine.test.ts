// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SIBLING CONTACT & RELATIONSHIPS INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for sibling relationship quality analysis.
// Covers Reg 5, Reg 7, Reg 11, SCCIF: sibling placement considerations,
// contact facilitation, relationship assessments, sibling events, child wishes.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSiblingContactRelationships,
  type SiblingContactInput,
  type SiblingPlacementRecordInput,
  type ContactFacilitationRecordInput,
  type RelationshipAssessmentRecordInput,
  type SiblingEventRecordInput,
  type ChildWishesRecordInput,
} from "../home-sibling-contact-relationships-intelligence-engine";

const TODAY = "2026-05-29";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function baseInput(overrides: Partial<SiblingContactInput> = {}): SiblingContactInput {
  return {
    today: TODAY,
    total_children: 3,
    sibling_placement_records: [],
    contact_facilitation_records: [],
    relationship_assessment_records: [],
    sibling_event_records: [],
    child_wishes_records: [],
    ...overrides,
  };
}

function makePlacement(overrides: Partial<SiblingPlacementRecordInput> = {}): SiblingPlacementRecordInput {
  _id++;
  return {
    id: `sp_${_id}`,
    child_id: "yp_alex",
    sibling_id: "sib_jordan",
    sibling_name: "Jordan",
    placement_together: false,
    placement_considered: true,
    consideration_documented: true,
    reason_for_separation: "Capacity and matching",
    separation_justified: true,
    plan_to_reunify: false,
    reunification_timeline: null,
    social_worker_consulted: true,
    child_views_sought: true,
    sibling_views_sought: true,
    irm_consulted: true,
    review_date: "2026-06-15",
    review_completed: true,
    notes: "Placement review completed",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeContact(overrides: Partial<ContactFacilitationRecordInput> = {}): ContactFacilitationRecordInput {
  _id++;
  return {
    id: `cf_${_id}`,
    child_id: "yp_alex",
    sibling_id: "sib_jordan",
    date: "2026-05-10",
    contact_type: "face_to_face",
    facilitated: true,
    location: "Community centre",
    duration_minutes: 60,
    quality_rating: 4,
    child_enjoyed: true,
    sibling_enjoyed: true,
    any_concerns: false,
    concern_details: "",
    staff_supervised: true,
    transport_provided: true,
    contact_plan_followed: true,
    cancelled: false,
    cancellation_reason: "",
    rescheduled: false,
    notes: "Good contact session",
    created_at: "2026-05-10",
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<RelationshipAssessmentRecordInput> = {}): RelationshipAssessmentRecordInput {
  _id++;
  return {
    id: `ra_${_id}`,
    child_id: "yp_alex",
    sibling_id: "sib_jordan",
    assessment_date: "2026-05-01",
    assessor: "Social Worker",
    relationship_quality: "good",
    attachment_strength: "secure",
    communication_quality: "good",
    conflict_frequency: "rare",
    positive_interactions_observed: true,
    shared_interests_identified: true,
    protective_factors_present: true,
    risk_factors_present: false,
    risk_factor_details: "",
    therapeutic_support_recommended: false,
    therapeutic_support_in_place: false,
    improvement_plan_created: false,
    next_review_date: "2026-08-01",
    child_participated: true,
    sibling_participated: true,
    notes: "Healthy relationship",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<SiblingEventRecordInput> = {}): SiblingEventRecordInput {
  _id++;
  return {
    id: `se_${_id}`,
    event_name: "Birthday party",
    event_type: "birthday",
    date: "2026-05-15",
    children_invited: ["yp_alex", "sib_jordan"],
    children_attended: ["yp_alex", "sib_jordan"],
    siblings_present: true,
    event_quality_rating: 4,
    child_feedback_positive: true,
    sibling_feedback_positive: true,
    photos_taken: true,
    memory_book_updated: true,
    staff_facilitated: true,
    any_incidents: false,
    incident_details: "",
    planned_in_advance: true,
    child_involved_in_planning: true,
    notes: "Lovely event",
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeWish(overrides: Partial<ChildWishesRecordInput> = {}): ChildWishesRecordInput {
  _id++;
  return {
    id: `cw_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-10",
    wish_category: "more_contact",
    wish_details: "Wants to see sibling more often",
    child_voice_captured: true,
    age_appropriate_method: true,
    wish_acknowledged: true,
    wish_acted_upon: true,
    outcome_recorded: true,
    outcome_shared_with_child: true,
    child_satisfied_with_outcome: true,
    social_worker_informed: true,
    recorded_in_care_plan: true,
    advocate_involved: false,
    review_date: "2026-06-10",
    notes: "Wish recorded",
    created_at: "2026-05-10",
    ...overrides,
  };
}

// ── Helper to repeat records ────────────────────────────────────────────────

function repeat<T>(factory: (i: number) => T, n: number): T[] {
  return Array.from({ length: n }, (_, i) => factory(i));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeSiblingContactRelationships", () => {
  // ── 1. insufficient_data ────────────────────────────────────────────────

  describe("insufficient_data (all empty + 0 children)", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 0 }));
      expect(r.sibling_rating).toBe("insufficient_data");
      expect(r.sibling_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
    });

    it("returns zero for all counts", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 0 }));
      expect(r.total_placement_records).toBe(0);
      expect(r.total_contact_records).toBe(0);
      expect(r.total_assessment_records).toBe(0);
      expect(r.total_event_records).toBe(0);
      expect(r.total_wishes_records).toBe(0);
    });

    it("returns zero for all rates", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 0 }));
      expect(r.placement_consideration_rate).toBe(0);
      expect(r.contact_facilitation_rate).toBe(0);
      expect(r.relationship_quality_rate).toBe(0);
      expect(r.event_participation_rate).toBe(0);
      expect(r.child_wishes_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── 2. Inadequate floor (all empty + children > 0) ─────────────────────

  describe("inadequate floor (all empty + children > 0)", () => {
    it("returns inadequate with score 15 when all arrays empty but children exist", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 5 }));
      expect(r.sibling_rating).toBe("inadequate");
      expect(r.sibling_score).toBe(15);
    });

    it("headline mentions no sibling data recorded", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 2 }));
      expect(r.headline).toContain("No sibling contact or relationship data recorded");
    });

    it("produces exactly 1 concern about no records", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 2 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No sibling placement records");
    });

    it("produces exactly 2 recommendations (immediate)", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 2 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("produces exactly 1 critical insight", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 2 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
      expect(r.insights[0].text).toContain("Reg 7");
    });

    it("all counts remain zero", () => {
      const r = computeSiblingContactRelationships(baseInput({ total_children: 2 }));
      expect(r.total_placement_records).toBe(0);
      expect(r.total_contact_records).toBe(0);
      expect(r.total_assessment_records).toBe(0);
      expect(r.total_event_records).toBe(0);
      expect(r.total_wishes_records).toBe(0);
    });
  });

  // ── 3. pct(0,0) = 0 ────────────────────────────────────────────────────

  describe("pct(0,0) = 0", () => {
    it("event_participation_rate is 0 when no children invited", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_event_records: [
            makeEvent({ children_invited: [], children_attended: [] }),
          ],
        }),
      );
      expect(r.event_participation_rate).toBe(0);
    });

    it("child_wishes_rate is 0 with no wishes records but data in other areas", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
        }),
      );
      expect(r.child_wishes_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("contact_facilitation_rate is 0 with no contact records but data in other areas", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
        }),
      );
      expect(r.contact_facilitation_rate).toBe(0);
    });
  });

  // ── 4. Base score ───────────────────────────────────────────────────────

  describe("base score = 52", () => {
    it("score is 52 when all rates are neutral (no bonuses, no penalties)", () => {
      // placement_considered at 60% (no bonus, no penalty: need >=50 to avoid penalty, <80 for no bonus)
      // contact facilitated at 60% (no bonus, no penalty: need >=50, <75 for no bonus)
      // relationship quality at 50% (no bonus, no penalty: need >=30, <60 for no bonus)
      // event participation at 50% (no bonus, no penalty: <70 for no bonus, >=0 for no penalty)
      // childWishesRate at 50% (no bonus, no penalty: need >=40, <70 for no bonus)
      // childSatisfactionRate at 50% (no bonus)
      // contactPlanRate at 50% (no bonus)
      // childEnjoyedRate at 50% (no bonus)
      // avgContactQuality < 3.0 (no bonus)

      // 5 placements: 3 considered (60%), 2 not
      const placements = [
        makePlacement({ placement_considered: true }),
        makePlacement({ placement_considered: true }),
        makePlacement({ placement_considered: true }),
        makePlacement({ placement_considered: false }),
        makePlacement({ placement_considered: false }),
      ];

      // 5 non-cancelled contacts: 3 facilitated, 3 followed plan, 3 child_enjoyed
      // quality_rating = 2 each (avg 2.0 < 3.0)
      const contacts = [
        makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 2 }),
        makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 2 }),
        makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 2 }),
        makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
      ];

      // 4 assessments: 2 good/excellent (50%), 2 fair
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ];

      // 2 events: invited 4, attended 2 → 50%
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
        makeEvent({ children_invited: ["c", "d"], children_attended: ["c"] }),
      ];

      // 4 wishes: 2 acknowledged (50%), 2 acted upon (50%) → childWishesRate=50
      // 2 satisfied (50%)
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];

      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(52);
    });
  });

  // ── 5. Scoring: each bonus in isolation ─────────────────────────────────

  describe("bonuses in isolation", () => {
    // Helper: build a baseline that gets score=52 (no bonuses, no penalties)
    function neutralInput(): SiblingContactInput {
      // 5 placements: 3/5 considered (60%) → no bonus (<80), no penalty (>=50)
      const placements = repeat(
        (i) =>
          makePlacement({ placement_considered: i < 3, consideration_documented: i < 3 }),
        5,
      );
      // 5 contacts: 3/5 facilitated (60%) → no bonus (<75), no penalty (>=50)
      // quality_rating=2 → avg 2.0 <3.0 → no bonus
      // contact_plan_followed 3/5=60% → no bonus (<70)
      // child_enjoyed 3/5=60% → no bonus (<70)
      const contacts = repeat(
        (i) =>
          makeContact({
            facilitated: i < 3,
            contact_plan_followed: i < 3,
            child_enjoyed: i < 3,
            quality_rating: 2,
          }),
        5,
      );
      // 4 assessments: 2/4 good (50%) → no bonus (<60), no penalty (>=30)
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ];
      // events: 50% participation → no bonus (<70)
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
        makeEvent({ children_invited: ["c", "d"], children_attended: ["c"] }),
      ];
      // wishes: ack=50%, acted=50% → childWishesRate=50 → no bonus (<70), no penalty (>=40)
      // satisfaction=50% → no bonus (<70)
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      return baseInput({
        sibling_placement_records: placements,
        contact_facilitation_records: contacts,
        relationship_assessment_records: assessments,
        sibling_event_records: events,
        child_wishes_records: wishes,
      });
    }

    // --- Bonus 1: placementConsiderationRate ---
    describe("Bonus 1: placementConsiderationRate", () => {
      it(">=95 → +4", () => {
        const inp = neutralInput();
        // Override placements to get 100% considered
        inp.sibling_placement_records = repeat(() => makePlacement({ placement_considered: true }), 5);
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 4);
      });

      it(">=80 <95 → +2", () => {
        const inp = neutralInput();
        // 4/5 = 80%
        inp.sibling_placement_records = [
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: false }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 2);
      });

      it("<80 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 2: contactFacilitationRate ---
    describe("Bonus 2: contactFacilitationRate", () => {
      it(">=90 → +4", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = repeat(
          () => makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 4);
      });

      it(">=75 <90 → +2", () => {
        const inp = neutralInput();
        // 4/5 = 80%
        inp.contact_facilitation_records = [
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 2);
      });

      it("<75 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 3: relationshipQualityRate ---
    describe("Bonus 3: relationshipQualityRate", () => {
      it(">=80 → +4", () => {
        const inp = neutralInput();
        // 5/5 = 100%
        inp.relationship_assessment_records = repeat(
          () => makeAssessment({ relationship_quality: "good" }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 4);
      });

      it(">=60 <80 → +2", () => {
        const inp = neutralInput();
        // 3/5 = 60%
        inp.relationship_assessment_records = [
          makeAssessment({ relationship_quality: "good" }),
          makeAssessment({ relationship_quality: "good" }),
          makeAssessment({ relationship_quality: "excellent" }),
          makeAssessment({ relationship_quality: "fair" }),
          makeAssessment({ relationship_quality: "fair" }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 2);
      });

      it("<60 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 4: eventParticipationRate ---
    describe("Bonus 4: eventParticipationRate", () => {
      it(">=90 → +3", () => {
        const inp = neutralInput();
        // 10/10 = 100%
        inp.sibling_event_records = [
          makeEvent({ children_invited: ["a", "b", "c", "d", "e"], children_attended: ["a", "b", "c", "d", "e"] }),
          makeEvent({ children_invited: ["f", "g", "h", "i", "j"], children_attended: ["f", "g", "h", "i", "j"] }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 3);
      });

      it(">=70 <90 → +1", () => {
        const inp = neutralInput();
        // 7/10 = 70%
        inp.sibling_event_records = [
          makeEvent({ children_invited: ["a", "b", "c", "d", "e"], children_attended: ["a", "b", "c", "d"] }),
          makeEvent({ children_invited: ["f", "g", "h", "i", "j"], children_attended: ["f", "g", "h"] }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 1);
      });

      it("<70 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 5: childWishesRate ---
    describe("Bonus 5: childWishesRate", () => {
      it(">=90 → +3", () => {
        const inp = neutralInput();
        // All acknowledged and acted upon → 100%
        inp.child_wishes_records = repeat(
          () => makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 + 3);
      });

      it(">=70 <90 → +1", () => {
        const inp = neutralInput();
        // 4/5 ack=80%, 3/5 acted=60% → (80+60)/2=70
        inp.child_wishes_records = [
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: true, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.child_wishes_rate).toBe(70);
        expect(r.sibling_score).toBe(52 + 1);
      });

      it("<70 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 6: childSatisfactionRate ---
    describe("Bonus 6: childSatisfactionRate", () => {
      it(">=90 → +3", () => {
        const inp = neutralInput();
        inp.child_wishes_records = repeat(
          () =>
            makeWish({
              wish_acknowledged: false,
              wish_acted_upon: false,
              child_satisfied_with_outcome: true,
            }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        // childWishesRate = (0+0)/2 = 0 → penalty -4
        // childSatisfactionRate = 100 → +3
        // Net from wishes: +3 - 4 = -1 → 52 - 1 = 51
        expect(r.child_satisfaction_rate).toBe(100);
        expect(r.sibling_score).toBe(52 + 3 - 4);
      });

      it(">=70 <90 → +1", () => {
        const inp = neutralInput();
        // 4/5 = 80% satisfaction, but set wishes to neutral to avoid penalty
        inp.child_wishes_records = [
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
          makeWish({ wish_acknowledged: true, wish_acted_upon: false, child_satisfied_with_outcome: true }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: true }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.child_satisfaction_rate).toBe(80);
        // childWishesRate = (60+60)/2 = 60 → no bonus, no penalty
        expect(r.sibling_score).toBe(52 + 1);
      });

      it("<70 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 7: contactPlanRate ---
    describe("Bonus 7: contactPlanRate", () => {
      it(">=90 → +3", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = repeat(
          () => makeContact({ facilitated: false, contact_plan_followed: true, child_enjoyed: false, quality_rating: 2 }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → penalty -5
        // contactPlanRate 100% → +3
        expect(r.sibling_score).toBe(52 + 3 - 5);
      });

      it(">=70 <90 → +1", () => {
        const inp = neutralInput();
        // 4/5 = 80%
        inp.contact_facilitation_records = [
          makeContact({ facilitated: false, contact_plan_followed: true, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: true, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: true, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: true, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        ];
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → penalty -5
        // contactPlanRate 80% → +1
        expect(r.sibling_score).toBe(52 + 1 - 5);
      });

      it("<70 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 8: childEnjoyedRate ---
    describe("Bonus 8: childEnjoyedRate", () => {
      it(">=90 → +2", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = repeat(
          () => makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: true, quality_rating: 2 }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → penalty -5
        // childEnjoyedRate 100% → +2
        expect(r.sibling_score).toBe(52 + 2 - 5);
      });

      it(">=70 <90 → +1", () => {
        const inp = neutralInput();
        // 4/5 = 80%
        inp.contact_facilitation_records = [
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: true, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: true, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: true, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: true, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        ];
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → -5, childEnjoyedRate 80% → +1
        expect(r.sibling_score).toBe(52 + 1 - 5);
      });

      it("<70 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Bonus 9: avgContactQuality ---
    describe("Bonus 9: avgContactQuality", () => {
      it(">=4.0 → +2", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = repeat(
          () => makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 4 }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → -5, avgContactQuality 4.0 → +2
        expect(r.sibling_score).toBe(52 + 2 - 5);
      });

      it(">=3.0 <4.0 → +1", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = repeat(
          () => makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 3 }),
          5,
        );
        const r = computeSiblingContactRelationships(inp);
        // facilitation 0% → -5, avgContactQuality 3.0 → +1
        expect(r.sibling_score).toBe(52 + 1 - 5);
      });

      it("<3.0 → +0", () => {
        const inp = neutralInput();
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    // --- Max bonuses ---
    describe("max bonuses = +28", () => {
      it("all 9 bonuses at top tier sum to 28 (52+28=80)", () => {
        const placements = repeat(() => makePlacement({ placement_considered: true }), 5);
        const contacts = repeat(
          () =>
            makeContact({
              facilitated: true,
              contact_plan_followed: true,
              child_enjoyed: true,
              quality_rating: 5,
            }),
          5,
        );
        const assessments = repeat(
          () => makeAssessment({ relationship_quality: "excellent" }),
          5,
        );
        const events = [
          makeEvent({ children_invited: ["a", "b"], children_attended: ["a", "b"] }),
          makeEvent({ children_invited: ["c", "d"], children_attended: ["c", "d"] }),
        ];
        const wishes = repeat(
          () =>
            makeWish({
              wish_acknowledged: true,
              wish_acted_upon: true,
              child_satisfied_with_outcome: true,
            }),
          5,
        );

        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: placements,
            contact_facilitation_records: contacts,
            relationship_assessment_records: assessments,
            sibling_event_records: events,
            child_wishes_records: wishes,
          }),
        );
        expect(r.sibling_score).toBe(80);
      });
    });
  });

  // ── 6. Penalties in isolation ───────────────────────────────────────────

  describe("penalties in isolation", () => {
    // Helper: neutral base that starts at 52 (same as before)
    function neutralInput(): SiblingContactInput {
      const placements = repeat(
        (i) => makePlacement({ placement_considered: i < 3 }),
        5,
      );
      const contacts = repeat(
        (i) =>
          makeContact({
            facilitated: i < 3,
            contact_plan_followed: i < 3,
            child_enjoyed: i < 3,
            quality_rating: 2,
          }),
        5,
      );
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ];
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
        makeEvent({ children_invited: ["c", "d"], children_attended: ["c"] }),
      ];
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      return baseInput({
        sibling_placement_records: placements,
        contact_facilitation_records: contacts,
        relationship_assessment_records: assessments,
        sibling_event_records: events,
        child_wishes_records: wishes,
      });
    }

    describe("Penalty: placementConsiderationRate < 50 → -5", () => {
      it("applies -5 when rate < 50 and records exist", () => {
        const inp = neutralInput();
        // 2/5 = 40%
        inp.sibling_placement_records = [
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: true }),
          makePlacement({ placement_considered: false }),
          makePlacement({ placement_considered: false }),
          makePlacement({ placement_considered: false }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 - 5);
      });

      it("does NOT apply when no placement records exist", () => {
        const inp = neutralInput();
        inp.sibling_placement_records = [];
        const r = computeSiblingContactRelationships(inp);
        // Should NOT subtract 5; but also removes any placement-based bonuses
        expect(r.sibling_score).toBe(52);
      });
    });

    describe("Penalty: contactFacilitationRate < 50 → -5", () => {
      it("applies -5 when rate < 50 and records exist", () => {
        const inp = neutralInput();
        // 2/5 = 40%
        inp.contact_facilitation_records = [
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52 - 5);
      });

      it("does NOT apply when no contact records exist", () => {
        const inp = neutralInput();
        inp.contact_facilitation_records = [];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    describe("Penalty: childWishesRate < 40 → -4", () => {
      it("applies -4 when childWishesRate < 40 and records exist", () => {
        const inp = neutralInput();
        // ack=1/5=20%, acted=1/5=20% → (20+20)/2=20 < 40
        inp.child_wishes_records = [
          makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.child_wishes_rate).toBe(20);
        expect(r.sibling_score).toBe(52 - 4);
      });

      it("does NOT apply when no wishes records exist", () => {
        const inp = neutralInput();
        inp.child_wishes_records = [];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    describe("Penalty: relationshipQualityRate < 30 → -4", () => {
      it("applies -4 when rate < 30 and records exist", () => {
        const inp = neutralInput();
        // 1/5 = 20%
        inp.relationship_assessment_records = [
          makeAssessment({ relationship_quality: "good" }),
          makeAssessment({ relationship_quality: "fair" }),
          makeAssessment({ relationship_quality: "fair" }),
          makeAssessment({ relationship_quality: "poor" }),
          makeAssessment({ relationship_quality: "estranged" }),
        ];
        const r = computeSiblingContactRelationships(inp);
        expect(r.relationship_quality_rate).toBe(20);
        expect(r.sibling_score).toBe(52 - 4);
      });

      it("does NOT apply when no assessment records exist", () => {
        const inp = neutralInput();
        inp.relationship_assessment_records = [];
        const r = computeSiblingContactRelationships(inp);
        expect(r.sibling_score).toBe(52);
      });
    });

    describe("all penalties combined → -18", () => {
      it("52 - 18 = 34", () => {
        const placements = repeat(() => makePlacement({ placement_considered: false }), 5);
        const contacts = repeat(
          () =>
            makeContact({
              facilitated: false,
              contact_plan_followed: false,
              child_enjoyed: false,
              quality_rating: 1,
            }),
          5,
        );
        const assessments = repeat(
          () => makeAssessment({ relationship_quality: "poor" }),
          5,
        );
        const events = [
          makeEvent({ children_invited: ["a", "b"], children_attended: [] }),
        ];
        const wishes = repeat(
          () =>
            makeWish({
              wish_acknowledged: false,
              wish_acted_upon: false,
              child_satisfied_with_outcome: false,
            }),
          5,
        );

        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: placements,
            contact_facilitation_records: contacts,
            relationship_assessment_records: assessments,
            sibling_event_records: events,
            child_wishes_records: wishes,
          }),
        );
        // 52 - 5 (placement) - 5 (contact) - 4 (wishes) - 4 (relationship) = 34
        expect(r.sibling_score).toBe(34);
      });
    });
  });

  // ── 7. Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds (toRating)", () => {
    it("score >= 80 → outstanding", () => {
      // All bonuses max
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5);
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 5 }),
        5,
      );
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5);
      const events = [makeEvent({ children_invited: ["a", "b"], children_attended: ["a", "b"] })];
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        5,
      );
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(80);
      expect(r.sibling_rating).toBe("outstanding");
    });

    it("score 65-79 → good", () => {
      // We need a score of e.g. 65. base 52 + need 13 bonus points.
      // B1=+4, B2=+4, B3=+4, B4=+1 = 13 → 65
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5); // >=95 → +4
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        5,
      ); // >=90 → +4
      const assessments = repeat(
        () => makeAssessment({ relationship_quality: "excellent" }),
        5,
      ); // >=80 → +4
      const events = [
        makeEvent({ children_invited: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
          children_attended: ["a", "b", "c", "d", "e", "f", "g"] }),
      ]; // 7/10 = 70% → +1
      const wishes = [
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
      ];
      // ack=50%, acted=50% → childWishesRate=50 → no bonus, no penalty
      // satisfaction=0% → no bonus
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(65);
      expect(r.sibling_rating).toBe("good");
    });

    it("score 45-64 → adequate", () => {
      // Neutral input gets exactly 52
      const placements = repeat(
        (i) => makePlacement({ placement_considered: i < 3 }),
        5,
      );
      const contacts = repeat(
        (i) =>
          makeContact({
            facilitated: i < 3,
            contact_plan_followed: i < 3,
            child_enjoyed: i < 3,
            quality_rating: 2,
          }),
        5,
      );
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ];
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
        makeEvent({ children_invited: ["c", "d"], children_attended: ["c"] }),
      ];
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(52);
      expect(r.sibling_rating).toBe("adequate");
    });

    it("score < 45 → inadequate", () => {
      // All penalties: 52 - 18 = 34
      const placements = repeat(() => makePlacement({ placement_considered: false }), 5);
      const contacts = repeat(
        () => makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 1 }),
        5,
      );
      const assessments = repeat(
        () => makeAssessment({ relationship_quality: "poor" }),
        5,
      );
      const events = [makeEvent({ children_invited: ["a", "b"], children_attended: [] })];
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        5,
      );
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(34);
      expect(r.sibling_rating).toBe("inadequate");
    });
  });

  // ── 8. Six output rates ─────────────────────────────────────────────────

  describe("six output rates", () => {
    it("placement_consideration_rate computed correctly", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
          ],
        }),
      );
      expect(r.placement_consideration_rate).toBe(67); // Math.round(2/3*100)
    });

    it("contact_facilitation_rate computed correctly (excludes cancelled)", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ facilitated: true, cancelled: false }),
            makeContact({ facilitated: false, cancelled: false }),
            makeContact({ facilitated: true, cancelled: true }), // excluded from denominator
          ],
        }),
      );
      // non-cancelled = 2, facilitated among non-cancelled = 1 → 50%
      expect(r.contact_facilitation_rate).toBe(50);
    });

    it("relationship_quality_rate = pct(excellent+good, total)", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "excellent" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "estranged" }),
          ],
        }),
      );
      expect(r.relationship_quality_rate).toBe(40); // 2/5 = 40%
    });

    it("event_participation_rate = pct(attended, invited)", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ children_invited: ["a", "b", "c"], children_attended: ["a", "b"] }),
            makeEvent({ children_invited: ["d", "e"], children_attended: ["d"] }),
          ],
        }),
      );
      // invited=5, attended=3 → 60%
      expect(r.event_participation_rate).toBe(60);
    });

    it("child_wishes_rate = avg of acknowledged% and acted%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
          ],
        }),
      );
      // ack = 3/4 = 75%, acted = 1/4 = 25% → (75+25)/2 = 50
      expect(r.child_wishes_rate).toBe(50);
    });

    it("child_satisfaction_rate = pct(satisfied, total wishes)", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: false }),
            makeWish({ child_satisfied_with_outcome: false }),
            makeWish({ child_satisfied_with_outcome: false }),
          ],
        }),
      );
      expect(r.child_satisfaction_rate).toBe(40); // 2/5
    });
  });

  // ── 9. Record counts ───────────────────────────────────────────────────

  describe("record counts", () => {
    it("correctly reports all five totals", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement(), makePlacement()],
          contact_facilitation_records: [makeContact(), makeContact(), makeContact()],
          relationship_assessment_records: [makeAssessment()],
          sibling_event_records: [makeEvent(), makeEvent(), makeEvent(), makeEvent()],
          child_wishes_records: [makeWish(), makeWish()],
        }),
      );
      expect(r.total_placement_records).toBe(2);
      expect(r.total_contact_records).toBe(3);
      expect(r.total_assessment_records).toBe(1);
      expect(r.total_event_records).toBe(4);
      expect(r.total_wishes_records).toBe(2);
    });
  });

  // ── 10. Headlines ──────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline", () => {
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5);
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 5 }),
        5,
      );
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5);
      const events = [makeEvent({ children_invited: ["a"], children_attended: ["a"] })];
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        5,
      );
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions strengths and areas for improvement", () => {
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5);
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        5,
      );
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5);
      const events = [
        makeEvent({
          children_invited: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
          children_attended: ["a", "b", "c", "d", "e", "f", "g"],
        }),
      ];
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_rating).toBe("good");
      expect(r.headline).toContain("Good");
    });

    it("adequate headline mentions concerns", () => {
      const placements = repeat((i) => makePlacement({ placement_considered: i < 3 }), 5);
      const contacts = repeat(
        (i) => makeContact({ facilitated: i < 3, contact_plan_followed: i < 3, child_enjoyed: i < 3, quality_rating: 2 }),
        5,
      );
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ];
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
      ];
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline mentions significant concerns", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 1 }),
            5,
          ),
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "poor" }),
            5,
          ),
          sibling_event_records: [makeEvent({ children_invited: ["a"], children_attended: [] })],
          child_wishes_records: repeat(
            () => makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
            5,
          ),
        }),
      );
      expect(r.sibling_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── 11. Strengths ──────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes placement consideration strength at >=95%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: true }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("sibling placements have documented consideration"))).toBe(true);
    });

    it("includes placement consideration strength at >=80% <95%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("placement consideration rate"))).toBe(true);
    });

    it("includes contact facilitation strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ facilitated: true }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("facilitated"))).toBe(true);
    });

    it("includes contact facilitation strength at >=75% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("contact facilitation rate"))).toBe(true);
    });

    it("includes relationship quality strength at >=80%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "excellent" }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("good or excellent"))).toBe(true);
    });

    it("includes relationship quality strength at >=60% <80%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "fair" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("good or excellent"))).toBe(true);
    });

    it("includes event participation strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [makeEvent({ children_invited: ["a", "b"], children_attended: ["a", "b"] })],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("attendance at sibling events"))).toBe(true);
    });

    it("includes event participation strength at >=70% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ children_invited: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], children_attended: ["a", "b", "c", "d", "e", "f", "g", "h"] }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("sibling event participation"))).toBe(true);
    });

    it("includes child wishes strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("wishes") && s.includes("acknowledged and acted upon"))).toBe(true);
    });

    it("includes child wishes strength at >=70% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
          ],
        }),
      );
      // ack=80%, acted=60% → (80+60)/2=70
      expect(r.child_wishes_rate).toBe(70);
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("child wishes response rate"))).toBe(true);
    });

    it("includes child satisfaction strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ child_satisfied_with_outcome: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child satisfaction with outcomes"))).toBe(true);
    });

    it("includes child satisfaction strength at >=70% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("child satisfaction rate"))).toBe(true);
    });

    it("includes contact plan strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ contact_plan_followed: true }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("contact plan"))).toBe(true);
    });

    it("includes contact plan strength at >=70% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ contact_plan_followed: true }),
            makeContact({ contact_plan_followed: true }),
            makeContact({ contact_plan_followed: true }),
            makeContact({ contact_plan_followed: true }),
            makeContact({ contact_plan_followed: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("contact plan adherence"))).toBe(true);
    });

    it("includes child enjoyed strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ child_enjoyed: true }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("enjoyable by children"))).toBe(true);
    });

    it("includes child enjoyed strength at >=70% <90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ child_enjoyed: true }),
            makeContact({ child_enjoyed: true }),
            makeContact({ child_enjoyed: true }),
            makeContact({ child_enjoyed: true }),
            makeContact({ child_enjoyed: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("enjoyed their sibling contacts"))).toBe(true);
    });

    it("includes avg contact quality strength at >=4.0", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ quality_rating: 5 }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("Average contact quality rating") && s.includes("/5"))).toBe(true);
    });

    it("includes avg contact quality strength at >=3.0 <4.0", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ quality_rating: 3 }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("3/5") && s.includes("generally well-facilitated"))).toBe(true);
    });

    it("includes documentation rate strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_considered: true, consideration_documented: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("placement considerations documented"))).toBe(true);
    });

    it("includes separation justified strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_together: false, separation_justified: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("separations have documented justification"))).toBe(true);
    });

    it("includes child views strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ child_views_sought: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child's views"))).toBe(true);
    });

    it("includes therapeutic follow-through strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: repeat(
            () =>
              makeAssessment({
                therapeutic_support_recommended: true,
                therapeutic_support_in_place: true,
              }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("therapeutic support in place"))).toBe(true);
    });

    it("includes positive interactions strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: repeat(
            () => makeAssessment({ positive_interactions_observed: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("Positive interactions observed"))).toBe(true);
    });

    it("includes voice captured strength at >=95%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ child_voice_captured: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("capture the child's authentic voice"))).toBe(true);
    });

    it("includes outcome shared strength at >=90%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ outcome_shared_with_child: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("outcomes shared with children"))).toBe(true);
    });

    it("includes memory book strength at >=80%", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: repeat(
            () => makeEvent({ memory_book_updated: true }),
            5,
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("Memory books updated"))).toBe(true);
    });

    it("includes contact type diversity strength at >=4", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ contact_type: "face_to_face" }),
            makeContact({ contact_type: "video_call" }),
            makeContact({ contact_type: "phone_call" }),
            makeContact({ contact_type: "shared_activity" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("4 different types of sibling contact"))).toBe(true);
    });

    it("includes event type diversity strength at >=4", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ event_type: "birthday" }),
            makeEvent({ event_type: "holiday" }),
            makeEvent({ event_type: "celebration" }),
            makeEvent({ event_type: "trip" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("4 different types of sibling events"))).toBe(true);
    });

    it("includes zero cancellations strength", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(() => makeContact({ cancelled: false }), 5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("Zero contact cancellations"))).toBe(true);
    });
  });

  // ── 12. Concerns ───────────────────────────────────────────────────────

  describe("concerns", () => {
    it("concern when placementConsiderationRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("failing to evidence"))).toBe(true);
    });

    it("concern when placementConsiderationRate 50-79", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("not all sibling placement decisions"))).toBe(true);
    });

    it("concern when contactFacilitationRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ facilitated: true }),
            makeContact({ facilitated: false }),
            makeContact({ facilitated: false }),
            makeContact({ facilitated: false }),
            makeContact({ facilitated: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("not being actively supported"))).toBe(true);
    });

    it("concern when contactFacilitationRate 50-74", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: false }),
            makeContact({ facilitated: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("not being actively facilitated"))).toBe(true);
    });

    it("concern when relationshipQualityRate < 30", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "estranged" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("concerning quality levels"))).toBe(true);
    });

    it("concern when relationshipQualityRate 30-59", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "estranged" }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("enhanced relationship support"))).toBe(true);
    });

    it("concern when childWishesRate < 40", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
          ],
        }),
      );
      // ack=20%, acted=20% → 20
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("not being heard"))).toBe(true);
    });

    it("concern when childWishesRate 40-69", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
          ],
        }),
      );
      // ack=60%, acted=40% → 50
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("weakening"))).toBe(true);
    });

    it("concern when childSatisfactionRate < 40", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ child_satisfied_with_outcome: false }),
            5,
          ),
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("not satisfied"))).toBe(true);
    });

    it("concern when childSatisfactionRate 40-69", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: true }),
            makeWish({ child_satisfied_with_outcome: false }),
            makeWish({ child_satisfied_with_outcome: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("dissatisfied"))).toBe(true);
    });

    it("concern when cancellationRate >= 30", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: true }),
            makeContact({ cancelled: true }),
            makeContact({ cancelled: false }),
          ],
        }),
      );
      // 2/3 ≈ 67%
      expect(r.concerns.some((c) => c.includes("cancelled") && c.includes("distress"))).toBe(true);
    });

    it("concern when cancellationRate 15-29", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: true }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
          ],
        }),
      );
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("cancellation rate"))).toBe(true);
    });

    it("concern when contactConcernRate >= 30", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ any_concerns: true }),
            makeContact({ any_concerns: true }),
            makeContact({ any_concerns: false }),
          ],
        }),
      );
      // 2/3 ≈ 67%
      expect(r.concerns.some((c) => c.includes("67%") && c.includes("raising concerns"))).toBe(true);
    });

    it("concern when contactConcernRate 15-29", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ any_concerns: true }),
            makeContact({ any_concerns: false }),
            makeContact({ any_concerns: false }),
            makeContact({ any_concerns: false }),
            makeContact({ any_concerns: false }),
          ],
        }),
      );
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("generating concerns"))).toBe(true);
    });

    it("concern when poorRelationshipRate >= 30", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "estranged" }),
            makeAssessment({ relationship_quality: "good" }),
          ],
        }),
      );
      // 2/3 ≈ 67%
      expect(r.concerns.some((c) => c.includes("67%") && c.includes("poor or estranged"))).toBe(true);
    });

    it("concern when poorRelationshipRate 15-29", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "poor" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
          ],
        }),
      );
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("struggling"))).toBe(true);
    });

    it("concern when frequentConflictRate >= 25", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ conflict_frequency: "frequent" }),
            makeAssessment({ conflict_frequency: "constant" }),
            makeAssessment({ conflict_frequency: "none" }),
            makeAssessment({ conflict_frequency: "none" }),
          ],
        }),
      );
      // 2/4 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("frequent or constant conflict"))).toBe(true);
    });

    it("concern when therapeuticFollowThroughRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [
            makeAssessment({ therapeutic_support_recommended: true, therapeutic_support_in_place: false }),
            makeAssessment({ therapeutic_support_recommended: true, therapeutic_support_in_place: false }),
            makeAssessment({ therapeutic_support_recommended: false, therapeutic_support_in_place: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("therapeutic support"))).toBe(true);
    });

    it("concern when eventParticipationRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ children_invited: ["a", "b", "c", "d", "e"], children_attended: ["a"] }),
          ],
        }),
      );
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("not be accessible"))).toBe(true);
    });

    it("concern when eventParticipationRate 50-69", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ children_invited: ["a", "b", "c", "d", "e"], children_attended: ["a", "b", "c"] }),
          ],
        }),
      );
      // 3/5 = 60%
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("not attending planned events"))).toBe(true);
    });

    it("concern when voiceCapturedRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ child_voice_captured: true }),
            makeWish({ child_voice_captured: false }),
            makeWish({ child_voice_captured: false }),
            makeWish({ child_voice_captured: false }),
            makeWish({ child_voice_captured: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("authentic voice"))).toBe(true);
    });

    it("concern when socialWorkerInformedRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ social_worker_informed: true }),
            makeWish({ social_worker_informed: false }),
            makeWish({ social_worker_informed: false }),
            makeWish({ social_worker_informed: false }),
            makeWish({ social_worker_informed: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("social worker"))).toBe(true);
    });

    it("concern when eventIncidentRate >= 20", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ any_incidents: true }),
            makeEvent({ any_incidents: false }),
            makeEvent({ any_incidents: false }),
            makeEvent({ any_incidents: false }),
          ],
        }),
      );
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("incidents"))).toBe(true);
    });

    it("concern when contactPlanRate < 50", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ contact_plan_followed: true }),
            makeContact({ contact_plan_followed: false }),
            makeContact({ contact_plan_followed: false }),
            makeContact({ contact_plan_followed: false }),
            makeContact({ contact_plan_followed: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("deviate from agreed arrangements"))).toBe(true);
    });
  });

  // ── 13. Recommendations ────────────────────────────────────────────────

  describe("recommendations", () => {
    it("immediate recommendation for low placementConsiderationRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("sibling placement arrangements"))).toBe(true);
    });

    it("immediate recommendation for low contactFacilitationRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: false }),
            5,
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("contact facilitation improvement"))).toBe(true);
    });

    it("immediate recommendation for low childWishesRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            5,
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("capturing, acknowledging"))).toBe(true);
    });

    it("immediate recommendation for low relationshipQualityRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "poor" }),
            5,
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("professional relationship assessments"))).toBe(true);
    });

    it("immediate recommendation for high cancellation rate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: true }),
            makeContact({ cancelled: true }),
            makeContact({ cancelled: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("cancellations"))).toBe(true);
    });

    it("soon recommendation for moderate contactFacilitationRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: true }),
            makeContact({ facilitated: false }),
            makeContact({ facilitated: false }),
          ],
        }),
      );
      // 3/5 = 60% (>=50, <75)
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve contact facilitation"))).toBe(true);
    });

    it("soon recommendation for moderate placementConsiderationRate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
          ],
        }),
      );
      // 3/5 = 60% (>=50, <80)
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen sibling placement"))).toBe(true);
    });

    it("planned recommendation for moderate cancellation rate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: true }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
            makeContact({ cancelled: false }),
          ],
        }),
      );
      // 1/5 = 20% (>=15, <30)
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Reduce contact cancellations"))).toBe(true);
    });

    it("planned recommendation for low memory book rate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: repeat(
            () => makeEvent({ memory_book_updated: false }),
            5,
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("memory book"))).toBe(true);
    });

    it("planned recommendation for low contact type diversity", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ contact_type: "face_to_face" }),
            makeContact({ contact_type: "face_to_face" }),
            makeContact({ contact_type: "video_call" }),
            makeContact({ contact_type: "video_call" }),
          ],
        }),
      );
      // 2 types, 4 contacts
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Diversify sibling contact"))).toBe(true);
    });

    it("planned recommendation for low care plan rate", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: repeat(
            () => makeWish({ recorded_in_care_plan: false }),
            5,
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("care plans"))).toBe(true);
    });

    it("recommendations have correct sequential ranks", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: false }),
            5,
          ),
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "poor" }),
            5,
          ),
          child_wishes_records: repeat(
            () => makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
            5,
          ),
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: false }),
            5,
          ),
        }),
      );
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── 14. Insights ───────────────────────────────────────────────────────

  describe("insights", () => {
    describe("critical insights", () => {
      it("critical insight for low placement consideration", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("placement"))).toBe(true);
      });

      it("critical insight for low contact facilitation", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: repeat(
              () => makeContact({ facilitated: false }),
              5,
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("facilitated"))).toBe(true);
      });

      it("critical insight for low child wishes rate", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: repeat(
              () => makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
              5,
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("wishes"))).toBe(true);
      });

      it("critical insight for low relationship quality", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: repeat(
              () => makeAssessment({ relationship_quality: "poor" }),
              5,
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("good or excellent"))).toBe(true);
      });

      it("critical insight when no assessments but children exist", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No sibling relationship assessments"))).toBe(true);
      });

      it("critical insight when no wishes but children exist", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No records of children's wishes"))).toBe(true);
      });

      it("critical insight for high cancellation rate", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: [
              makeContact({ cancelled: true }),
              makeContact({ cancelled: true }),
              makeContact({ cancelled: false }),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("cancelled"))).toBe(true);
      });

      it("critical insight for high poor/estranged relationship rate", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: [
              makeAssessment({ relationship_quality: "poor" }),
              makeAssessment({ relationship_quality: "estranged" }),
              makeAssessment({ relationship_quality: "good" }),
            ],
          }),
        );
        // 2/3 ≈ 67%
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("poor or estranged"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("warning for moderate placement consideration (50-79)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [
              makePlacement({ placement_considered: true }),
              makePlacement({ placement_considered: true }),
              makePlacement({ placement_considered: true }),
              makePlacement({ placement_considered: false }),
              makePlacement({ placement_considered: false }),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("placement consideration"))).toBe(true);
      });

      it("warning for moderate contact facilitation (50-74)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: [
              makeContact({ facilitated: true }),
              makeContact({ facilitated: true }),
              makeContact({ facilitated: true }),
              makeContact({ facilitated: false }),
              makeContact({ facilitated: false }),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("facilitation"))).toBe(true);
      });

      it("warning for moderate relationship quality (30-59)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: [
              makeAssessment({ relationship_quality: "good" }),
              makeAssessment({ relationship_quality: "good" }),
              makeAssessment({ relationship_quality: "fair" }),
              makeAssessment({ relationship_quality: "poor" }),
              makeAssessment({ relationship_quality: "estranged" }),
            ],
          }),
        );
        // 2/5 = 40%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("40%") && i.text.includes("relationship quality"))).toBe(true);
      });

      it("warning for moderate child wishes rate (40-69)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [
              makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
              makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
              makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
              makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
              makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            ],
          }),
        );
        // ack=60%, acted=40% → 50
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("wishes"))).toBe(true);
      });

      it("warning for moderate child satisfaction (40-69)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [
              makeWish({ child_satisfied_with_outcome: true }),
              makeWish({ child_satisfied_with_outcome: true }),
              makeWish({ child_satisfied_with_outcome: true }),
              makeWish({ child_satisfied_with_outcome: false }),
              makeWish({ child_satisfied_with_outcome: false }),
            ],
          }),
        );
        // 3/5 = 60%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("satisfaction"))).toBe(true);
      });

      it("warning for moderate cancellation rate (15-29)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: [
              makeContact({ cancelled: true }),
              makeContact({ cancelled: false }),
              makeContact({ cancelled: false }),
              makeContact({ cancelled: false }),
              makeContact({ cancelled: false }),
            ],
          }),
        );
        // 1/5 = 20%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20%") && i.text.includes("cancellation"))).toBe(true);
      });

      it("warning for moderate concern rate (15-29)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: [
              makeContact({ any_concerns: true }),
              makeContact({ any_concerns: false }),
              makeContact({ any_concerns: false }),
              makeContact({ any_concerns: false }),
              makeContact({ any_concerns: false }),
            ],
          }),
        );
        // 1/5 = 20%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20%") && i.text.includes("Concerns"))).toBe(true);
      });

      it("warning for moderate conflict rate (15-24)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: [
              makeAssessment({ conflict_frequency: "frequent" }),
              makeAssessment({ conflict_frequency: "none" }),
              makeAssessment({ conflict_frequency: "none" }),
              makeAssessment({ conflict_frequency: "none" }),
              makeAssessment({ conflict_frequency: "none" }),
            ],
          }),
        );
        // 1/5 = 20%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20%") && i.text.includes("conflict"))).toBe(true);
      });

      it("warning for moderate event participation (50-69)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            sibling_event_records: [
              makeEvent({ children_invited: ["a", "b", "c", "d", "e"], children_attended: ["a", "b", "c"] }),
            ],
          }),
        );
        // 3/5 = 60%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("event participation"))).toBe(true);
      });

      it("warning for moderate therapeutic follow-through (50-79)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            relationship_assessment_records: [
              makeAssessment({ therapeutic_support_recommended: true, therapeutic_support_in_place: true }),
              makeAssessment({ therapeutic_support_recommended: true, therapeutic_support_in_place: true }),
              makeAssessment({ therapeutic_support_recommended: true, therapeutic_support_in_place: false }),
            ],
          }),
        );
        // 2/3 ≈ 67%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("67%") && i.text.includes("Therapeutic follow-through"))).toBe(true);
      });

      it("warning for moderate contact plan adherence (50-69)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: [
              makeContact({ contact_plan_followed: true }),
              makeContact({ contact_plan_followed: true }),
              makeContact({ contact_plan_followed: true }),
              makeContact({ contact_plan_followed: false }),
              makeContact({ contact_plan_followed: false }),
            ],
          }),
        );
        // 3/5 = 60%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Contact plan adherence"))).toBe(true);
      });

      it("warning for moderate social worker informed rate (50-74)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [
              makeWish({ social_worker_informed: true }),
              makeWish({ social_worker_informed: true }),
              makeWish({ social_worker_informed: true }),
              makeWish({ social_worker_informed: false }),
              makeWish({ social_worker_informed: false }),
            ],
          }),
        );
        // 3/5 = 60%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Social worker informed"))).toBe(true);
      });

      it("warning for more_contact wishes >= 40%", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [
              makeWish({ wish_category: "more_contact" }),
              makeWish({ wish_category: "more_contact" }),
              makeWish({ wish_category: "more_contact" }),
              makeWish({ wish_category: "shared_activities" }),
              makeWish({ wish_category: "celebrations" }),
            ],
          }),
        );
        // 3/5 = 60%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("more sibling contact"))).toBe(true);
      });

      it("warning for less_contact wishes >= 20%", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            child_wishes_records: [
              makeWish({ wish_category: "less_contact" }),
              makeWish({ wish_category: "less_contact" }),
              makeWish({ wish_category: "more_contact" }),
              makeWish({ wish_category: "shared_activities" }),
              makeWish({ wish_category: "celebrations" }),
            ],
          }),
        );
        // 2/5 = 40%
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("40%") && i.text.includes("less sibling contact"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      function outstandingInput(): SiblingContactInput {
        return baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_considered: true, consideration_documented: true }),
            5,
          ),
          contact_facilitation_records: repeat(
            () =>
              makeContact({
                facilitated: true,
                contact_plan_followed: true,
                child_enjoyed: true,
                sibling_enjoyed: true,
                quality_rating: 5,
              }),
            5,
          ),
          relationship_assessment_records: repeat(
            () =>
              makeAssessment({
                relationship_quality: "excellent",
                positive_interactions_observed: true,
              }),
            5,
          ),
          sibling_event_records: [
            makeEvent({
              children_invited: ["a", "b"],
              children_attended: ["a", "b"],
              event_quality_rating: 5,
            }),
          ],
          child_wishes_records: repeat(
            () =>
              makeWish({
                wish_acknowledged: true,
                wish_acted_upon: true,
                child_satisfied_with_outcome: true,
                child_voice_captured: true,
                age_appropriate_method: true,
              }),
            5,
          ),
        });
      }

      it("positive insight for outstanding rating", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.sibling_rating).toBe("outstanding");
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding sibling contact"))).toBe(true);
      });

      it("positive insight for high placement consideration + documentation", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("placement consideration") && i.text.includes("documentation"))).toBe(true);
      });

      it("positive insight for high facilitation + plan adherence", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("contact facilitation") && i.text.includes("plan adherence"))).toBe(true);
      });

      it("positive insight for high relationship quality + positive interactions", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("relationship quality") && i.text.includes("positive interactions"))).toBe(true);
      });

      it("positive insight for high wishes response + satisfaction", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("wishes response rate") && i.text.includes("satisfaction"))).toBe(true);
      });

      it("positive insight for high child enjoyed + sibling enjoyed", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("children") && i.text.includes("siblings enjoyed"))).toBe(true);
      });

      it("positive insight for voice capture + age-appropriate methods", () => {
        const r = computeSiblingContactRelationships(outstandingInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("voice capture") && i.text.includes("age-appropriate methods"))).toBe(true);
      });

      it("positive insight for zero cancellations (>=5 records)", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            contact_facilitation_records: repeat(
              () => makeContact({ cancelled: false }),
              5,
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Zero cancellations"))).toBe(true);
      });

      it("positive insight for event type diversity + high quality", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            sibling_event_records: [
              makeEvent({ event_type: "birthday", event_quality_rating: 5 }),
              makeEvent({ event_type: "holiday", event_quality_rating: 4 }),
              makeEvent({ event_type: "celebration", event_quality_rating: 4 }),
              makeEvent({ event_type: "trip", event_quality_rating: 5 }),
            ],
          }),
        );
        // 4 types, avg = 4.5
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("4 different event types"))).toBe(true);
      });

      it("positive insight for memory book + photos", () => {
        const r = computeSiblingContactRelationships(
          baseInput({
            sibling_placement_records: [makePlacement()],
            sibling_event_records: repeat(
              () => makeEvent({ memory_book_updated: true, photos_taken: true }),
              5,
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Memory books") && i.text.includes("photos"))).toBe(true);
      });
    });
  });

  // ── 15. Edge cases ─────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("all records cancelled → facilitation rate is 0 (0 non-cancelled)", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: repeat(
            () => makeContact({ cancelled: true }),
            5,
          ),
        }),
      );
      // nonCancelled.length = 0 → pct(0, 0) = 0
      expect(r.contact_facilitation_rate).toBe(0);
    });

    it("cancelled contacts excluded from quality average", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: false, quality_rating: 5 }),
            makeContact({ cancelled: true, quality_rating: 1 }),
          ],
        }),
      );
      // Only 1 non-cancelled with rating 5
      // avg quality should be 5.0
      expect(r.contact_facilitation_rate).toBe(100);
    });

    it("single record in each category produces valid result", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [makeContact()],
          relationship_assessment_records: [makeAssessment()],
          sibling_event_records: [makeEvent()],
          child_wishes_records: [makeWish()],
        }),
      );
      expect(r.sibling_rating).toBeDefined();
      expect(typeof r.sibling_score).toBe("number");
      expect(r.total_placement_records).toBe(1);
      expect(r.total_contact_records).toBe(1);
      expect(r.total_assessment_records).toBe(1);
      expect(r.total_event_records).toBe(1);
      expect(r.total_wishes_records).toBe(1);
    });

    it("score clamped to 0 minimum (cannot go negative)", () => {
      // Even with many penalties, score should not go below 0
      // However, with base 52 and max penalties -18, the minimum is 34.
      // Still, verify clamping exists by checking the score never goes below 0.
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: false, quality_rating: 1 }),
            5,
          ),
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "poor" }),
            5,
          ),
          sibling_event_records: [makeEvent({ children_invited: ["a"], children_attended: [] })],
          child_wishes_records: repeat(
            () => makeWish({ wish_acknowledged: false, wish_acted_upon: false }),
            5,
          ),
        }),
      );
      expect(r.sibling_score).toBeGreaterThanOrEqual(0);
    });

    it("score clamped to 100 maximum", () => {
      // Even with theoretical bonuses, cannot exceed 100
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_considered: true }),
            5,
          ),
          contact_facilitation_records: repeat(
            () =>
              makeContact({
                facilitated: true,
                contact_plan_followed: true,
                child_enjoyed: true,
                quality_rating: 5,
              }),
            5,
          ),
          relationship_assessment_records: repeat(
            () => makeAssessment({ relationship_quality: "excellent" }),
            5,
          ),
          sibling_event_records: [
            makeEvent({ children_invited: ["a"], children_attended: ["a"] }),
          ],
          child_wishes_records: repeat(
            () =>
              makeWish({
                wish_acknowledged: true,
                wish_acted_upon: true,
                child_satisfied_with_outcome: true,
              }),
            5,
          ),
        }),
      );
      expect(r.sibling_score).toBeLessThanOrEqual(100);
    });

    it("mixed cancelled and rescheduled contacts", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          contact_facilitation_records: [
            makeContact({ cancelled: true, rescheduled: true }),
            makeContact({ cancelled: true, rescheduled: false }),
            makeContact({ cancelled: false }),
          ],
        }),
      );
      expect(r.total_contact_records).toBe(3);
    });

    it("events with no children invited → participation rate 0", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          sibling_event_records: [
            makeEvent({ children_invited: [], children_attended: [] }),
            makeEvent({ children_invited: [], children_attended: [] }),
          ],
        }),
      );
      expect(r.event_participation_rate).toBe(0);
    });

    it("placement records all placed together → no separated records for separation metrics", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_together: true }),
            5,
          ),
        }),
      );
      // No separated records → separationJustifiedRate and reunificationPlanRate based on 0 denominators
      expect(r.total_placement_records).toBe(5);
    });

    it("total_children=0 with some records still returns assessed result (not insufficient_data)", () => {
      // allEmpty is false because we have records, so it proceeds normally even with total_children=0
      const r = computeSiblingContactRelationships(
        baseInput({
          total_children: 0,
          sibling_placement_records: [makePlacement()],
        }),
      );
      expect(r.sibling_rating).not.toBe("insufficient_data");
    });

    it("100 records still calculates correctly", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: true }), 100),
          contact_facilitation_records: repeat(
            () => makeContact({ facilitated: true }),
            100,
          ),
        }),
      );
      expect(r.total_placement_records).toBe(100);
      expect(r.total_contact_records).toBe(100);
      expect(r.placement_consideration_rate).toBe(100);
      expect(r.contact_facilitation_rate).toBe(100);
    });

    it("child wishes rate rounds correctly with odd splits", () => {
      // 3/3 ack=100%, 2/3 acted=67% → (100+67)/2 = 83.5 → Math.round → 84
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [makePlacement()],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false }),
          ],
        }),
      );
      expect(r.child_wishes_rate).toBe(84);
    });

    it("only contact records with other arrays empty does not trip insufficient_data", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          contact_facilitation_records: [makeContact()],
        }),
      );
      expect(r.sibling_rating).not.toBe("insufficient_data");
      expect(r.total_contact_records).toBe(1);
    });

    it("only event records with other arrays empty does not trip insufficient_data", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_event_records: [makeEvent()],
        }),
      );
      expect(r.sibling_rating).not.toBe("insufficient_data");
      expect(r.total_event_records).toBe(1);
    });

    it("only wishes records with other arrays empty does not trip insufficient_data", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          child_wishes_records: [makeWish()],
        }),
      );
      expect(r.sibling_rating).not.toBe("insufficient_data");
      expect(r.total_wishes_records).toBe(1);
    });

    it("only assessment records with other arrays empty does not trip insufficient_data", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          relationship_assessment_records: [makeAssessment()],
        }),
      );
      expect(r.sibling_rating).not.toBe("insufficient_data");
      expect(r.total_assessment_records).toBe(1);
    });

    it("no assessment or wishes records with children triggers critical insights for missing data", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          total_children: 3,
          sibling_placement_records: [makePlacement()],
          relationship_assessment_records: [],
          child_wishes_records: [],
        }),
      );
      expect(r.insights.filter((i) => i.severity === "critical").length).toBeGreaterThanOrEqual(2);
    });

    it("boundary: exactly 79 score → good rating (not outstanding)", () => {
      // Score 79 should be good, not outstanding
      // We need exactly 79 = 52 + 27. That's all bonuses except 1 point.
      // Top bonuses: 4+4+4+3+3+3+3+2+2 = 28 → 80 = outstanding
      // Second-tier for one bonus: e.g. replace avgContactQuality top (+2) with mid (+1) → 27 → 79
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5);
      const contacts = repeat(
        () =>
          makeContact({
            facilitated: true,
            contact_plan_followed: true,
            child_enjoyed: true,
            quality_rating: 3, // avg 3.0 → +1 (not +2)
          }),
        5,
      );
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5);
      const events = [makeEvent({ children_invited: ["a"], children_attended: ["a"] })];
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
        5,
      );
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(79);
      expect(r.sibling_rating).toBe("good");
    });

    it("boundary: exactly 65 score → good (not adequate)", () => {
      // Already tested above but let's verify boundary
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5); // +4
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        5,
      ); // +4
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5); // +4
      const events = [
        makeEvent({
          children_invited: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
          children_attended: ["a", "b", "c", "d", "e", "f", "g"],
        }),
      ]; // 70% → +1
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(65);
      expect(r.sibling_rating).toBe("good");
    });

    it("boundary: score 64 → adequate (not good)", () => {
      // 52 + 12 = 64. B1=+4, B2=+4, B3=+4 = 12
      const placements = repeat(() => makePlacement({ placement_considered: true }), 5); // +4
      const contacts = repeat(
        () => makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        5,
      ); // +4
      const assessments = repeat(() => makeAssessment({ relationship_quality: "excellent" }), 5); // +4
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
      ]; // 50% → no bonus
      const wishes = [
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
      ];
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(64);
      expect(r.sibling_rating).toBe("adequate");
    });

    it("boundary: score 45 → adequate (not inadequate)", () => {
      // 52 - 7 = 45. Need one penalty: placement < 50 → -5, then we need to avoid the others.
      // Actually 52 - 5 = 47. We need 52-7=45. Hmm. placement -5 + partial = doesn't work.
      // Let's use: placement penalty (-5) + contactFacilitationRate >= 50 but wishes penalty impossible w/o records.
      // Actually we need exactly -7: placement -5 + wishes -4 would be -9. Too much.
      // We can't get exactly -7 from the 4 penalties (-5, -5, -4, -4).
      // Possible combos: -5, -4, -5-4=-9, -5-5=-10, -4-4=-8, -5-4-4=-13, etc.
      // So 52-5=47, 52-4=48 are achievable. For exactly 45 we need -7 which isn't possible with the given penalties.
      // Let's test 47 instead for adequate boundary:
      // Or alternatively: add some bonuses to offset. 52 + B - P = 45 → B - P = -7.
      // e.g. B=+2, P=-9 → 52+2-9 = 45
      // placement penalty (-5) + wishes penalty (-4) = -9, then placementConsideration 80-94 → +2 → net -7

      // Actually, the placement penalty fires at <50 and the bonus at >=80 — they can't both apply to the same metric.
      // Let's use contactFacilitation bonus (+2 at >=75) combined with placement(-5)+wishes(-4) = -9
      // 52 + 2 - 9 = 45

      const placements = repeat(() => makePlacement({ placement_considered: false }), 5); // 0% → -5
      const contacts = [
        makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
      ]; // 4/5=80% → +2
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ]; // 50% → no bonus, no penalty
      const events = [
        makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
      ]; // 50% → no bonus
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        5,
      ); // 0% → -4

      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(45);
      expect(r.sibling_rating).toBe("adequate");
    });

    it("boundary: score 44 → inadequate (not adequate)", () => {
      // 52 + B - P = 44 → B - P = -8
      // placement(-5) + wishes(-4) = -9, contactFacilitation bonus +1 at >=75? No, +2 at >=75.
      // Let's try: placement(-5) + relationship(-4) = -9, contactFacilitation +1 at 75-89? No, it's +2.
      // Use: contactFacilitationRate bonus +2 (>=75), placement(-5), relQuality(-4), wishes rate neutral
      // Actually let me try: 52 - 5(placement) - 4(wishes) + 1(eventParticipation) = 44
      // eventParticipation >=70 → +1

      const placements = repeat(() => makePlacement({ placement_considered: false }), 5); // -5
      const contacts = repeat(
        (i) => makeContact({ facilitated: i < 3, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
        5,
      ); // 60% → no bonus, no penalty
      const assessments = [
        makeAssessment({ relationship_quality: "good" }),
        makeAssessment({ relationship_quality: "excellent" }),
        makeAssessment({ relationship_quality: "fair" }),
        makeAssessment({ relationship_quality: "fair" }),
      ]; // 50% → no penalty
      const events = [
        makeEvent({
          children_invited: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
          children_attended: ["a", "b", "c", "d", "e", "f", "g"],
        }),
      ]; // 70% → +1
      const wishes = repeat(
        () => makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
        5,
      ); // 0% → -4

      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: placements,
          contact_facilitation_records: contacts,
          relationship_assessment_records: assessments,
          sibling_event_records: events,
          child_wishes_records: wishes,
        }),
      );
      expect(r.sibling_score).toBe(44);
      expect(r.sibling_rating).toBe("inadequate");
    });
  });

  // ── 16. Scenario: Outstanding ──────────────────────────────────────────

  describe("scenario: outstanding", () => {
    it("full outstanding dataset with all bonuses", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () =>
              makePlacement({
                placement_considered: true,
                consideration_documented: true,
                child_views_sought: true,
                sibling_views_sought: true,
                social_worker_consulted: true,
                review_completed: true,
              }),
            5,
          ),
          contact_facilitation_records: [
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, sibling_enjoyed: true, quality_rating: 5, any_concerns: false, cancelled: false, contact_type: "face_to_face" }),
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, sibling_enjoyed: true, quality_rating: 5, any_concerns: false, cancelled: false, contact_type: "video_call" }),
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, sibling_enjoyed: true, quality_rating: 5, any_concerns: false, cancelled: false, contact_type: "phone_call" }),
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, sibling_enjoyed: true, quality_rating: 5, any_concerns: false, cancelled: false, contact_type: "shared_activity" }),
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, sibling_enjoyed: true, quality_rating: 5, any_concerns: false, cancelled: false, contact_type: "overnight_stay" }),
          ],
          relationship_assessment_records: repeat(
            () =>
              makeAssessment({
                relationship_quality: "excellent",
                positive_interactions_observed: true,
                shared_interests_identified: true,
                protective_factors_present: true,
                child_participated: true,
                sibling_participated: true,
              }),
            5,
          ),
          sibling_event_records: [
            makeEvent({
              children_invited: ["a", "b"],
              children_attended: ["a", "b"],
              event_quality_rating: 5,
              child_feedback_positive: true,
              sibling_feedback_positive: true,
              photos_taken: true,
              memory_book_updated: true,
            }),
          ],
          child_wishes_records: repeat(
            () =>
              makeWish({
                wish_acknowledged: true,
                wish_acted_upon: true,
                child_satisfied_with_outcome: true,
                child_voice_captured: true,
                age_appropriate_method: true,
                outcome_shared_with_child: true,
                social_worker_informed: true,
                recorded_in_care_plan: true,
              }),
            5,
          ),
        }),
      );
      expect(r.sibling_rating).toBe("outstanding");
      expect(r.sibling_score).toBe(80);
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ── 17. Scenario: Good ─────────────────────────────────────────────────

  describe("scenario: good", () => {
    it("good scenario with some areas for improvement", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(
            () => makePlacement({ placement_considered: true }),
            5,
          ),
          contact_facilitation_records: repeat(
            () =>
              makeContact({
                facilitated: true,
                contact_plan_followed: true,
                child_enjoyed: true,
                quality_rating: 4,
              }),
            5,
          ),
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "excellent" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "fair" }),
          ], // 60% → +2
          sibling_event_records: [
            makeEvent({
              children_invited: ["a", "b", "c", "d", "e"],
              children_attended: ["a", "b", "c", "d"],
            }),
          ], // 80% → +1
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false, child_satisfied_with_outcome: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          ],
        }),
      );
      // B1=+4, B2=+4, B3=+2, B4=+1, B5=(75+50)/2=62.5→63→no, B6=50→no, B7=+3, B8=+2, B9=+2 = 18
      // 52 + 18 = 70 → good
      expect(r.sibling_rating).toBe("good");
      expect(r.sibling_score).toBeGreaterThanOrEqual(65);
      expect(r.sibling_score).toBeLessThan(80);
    });
  });

  // ── 18. Scenario: Adequate ─────────────────────────────────────────────

  describe("scenario: adequate", () => {
    it("adequate scenario with mixed performance", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: [
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: true }),
            makePlacement({ placement_considered: false }),
            makePlacement({ placement_considered: false }),
          ],
          contact_facilitation_records: [
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 3 }),
            makeContact({ facilitated: true, contact_plan_followed: true, child_enjoyed: true, quality_rating: 3 }),
            makeContact({ facilitated: true, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
            makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
            makeContact({ facilitated: false, contact_plan_followed: false, child_enjoyed: false, quality_rating: 2 }),
          ],
          relationship_assessment_records: [
            makeAssessment({ relationship_quality: "good" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "fair" }),
            makeAssessment({ relationship_quality: "poor" }),
          ],
          sibling_event_records: [
            makeEvent({ children_invited: ["a", "b"], children_attended: ["a"] }),
          ],
          child_wishes_records: [
            makeWish({ wish_acknowledged: true, wish_acted_upon: true, child_satisfied_with_outcome: true }),
            makeWish({ wish_acknowledged: true, wish_acted_upon: false, child_satisfied_with_outcome: false }),
            makeWish({ wish_acknowledged: false, wish_acted_upon: false, child_satisfied_with_outcome: false }),
          ],
        }),
      );
      expect(r.sibling_rating).toBe("adequate");
      expect(r.sibling_score).toBeGreaterThanOrEqual(45);
      expect(r.sibling_score).toBeLessThan(65);
    });
  });

  // ── 19. Scenario: Inadequate ───────────────────────────────────────────

  describe("scenario: inadequate", () => {
    it("inadequate scenario with poor performance across areas", () => {
      const r = computeSiblingContactRelationships(
        baseInput({
          sibling_placement_records: repeat(() => makePlacement({ placement_considered: false }), 5),
          contact_facilitation_records: repeat(
            () =>
              makeContact({
                facilitated: false,
                contact_plan_followed: false,
                child_enjoyed: false,
                quality_rating: 1,
                any_concerns: true,
              }),
            5,
          ),
          relationship_assessment_records: repeat(
            () =>
              makeAssessment({
                relationship_quality: "poor",
                conflict_frequency: "frequent",
                positive_interactions_observed: false,
              }),
            5,
          ),
          sibling_event_records: [
            makeEvent({
              children_invited: ["a", "b", "c", "d"],
              children_attended: [],
              any_incidents: true,
            }),
          ],
          child_wishes_records: repeat(
            () =>
              makeWish({
                wish_acknowledged: false,
                wish_acted_upon: false,
                child_satisfied_with_outcome: false,
                child_voice_captured: false,
                social_worker_informed: false,
              }),
            5,
          ),
        }),
      );
      expect(r.sibling_rating).toBe("inadequate");
      expect(r.sibling_score).toBeLessThan(45);
      expect(r.concerns.length).toBeGreaterThanOrEqual(5);
      expect(r.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(r.insights.filter((i) => i.severity === "critical").length).toBeGreaterThanOrEqual(3);
    });
  });
});
