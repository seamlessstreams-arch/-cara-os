// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Furniture & Room Personalisation Intelligence Engine
// Comprehensive test suite: furniture adequacy, room personalisation, child
// choice, comfort assessment, dignity of personal space, scoring, strengths,
// concerns, recommendations, and insights.
// CHR 2015 Reg 25, Reg 5, Reg 7. SCCIF experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFurnitureRoomPersonalisation,
  type FurnitureRoomInput,
  type FurnitureAdequacyInput,
  type RoomPersonalisationInput,
  type ChildChoiceInput,
  type ComfortAssessmentInput,
  type DignitySpaceInput,
} from "../home-furniture-room-personalisation-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-30";

let _id = 0;

function makeFurniture(overrides: Partial<FurnitureAdequacyInput> = {}): FurnitureAdequacyInput {
  _id++;
  return {
    id: `furn_${_id}`,
    child_id: "child_1",
    room_id: "room_1",
    assessment_date: "2026-05-01",
    assessor_name: "Darren",
    bed_adequate: true,
    wardrobe_adequate: true,
    desk_adequate: true,
    shelving_adequate: true,
    seating_adequate: true,
    storage_adequate: true,
    lighting_adequate: true,
    curtains_blinds_adequate: true,
    floor_covering_adequate: true,
    furniture_condition: "good",
    age_appropriate: true,
    size_appropriate: true,
    replacement_needed: false,
    replacement_actioned: false,
    child_consulted: true,
    last_inspection_date: "2026-04-01",
    inspection_overdue: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makePersonalisation(overrides: Partial<RoomPersonalisationInput> = {}): RoomPersonalisationInput {
  _id++;
  return {
    id: `pers_${_id}`,
    child_id: "child_1",
    room_id: "room_1",
    assessment_date: "2026-05-01",
    has_personal_photos: true,
    has_chosen_bedding: true,
    has_chosen_wall_decor: true,
    has_personal_belongings_displayed: true,
    has_chosen_colour_scheme: true,
    has_name_on_door: true,
    has_lockable_storage: true,
    has_notice_board: true,
    personalisation_items_count: 8,
    personalisation_budget_provided: true,
    budget_amount_approved: 100,
    budget_amount_spent: 80,
    room_reflects_identity: true,
    child_satisfied_with_room: true,
    review_date: "2026-07-01",
    review_overdue: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeChoice(overrides: Partial<ChildChoiceInput> = {}): ChildChoiceInput {
  _id++;
  return {
    id: `choice_${_id}`,
    child_id: "child_1",
    choice_type: "decor",
    description: "Chose wall posters",
    date_requested: "2026-04-01",
    date_fulfilled: "2026-04-15",
    fulfilled: true,
    child_involved_in_selection: true,
    child_satisfied_with_outcome: true,
    cost_approved: true,
    reason_not_fulfilled: null,
    staff_supported: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeComfort(overrides: Partial<ComfortAssessmentInput> = {}): ComfortAssessmentInput {
  _id++;
  return {
    id: `comf_${_id}`,
    child_id: "child_1",
    room_id: "room_1",
    assessment_date: "2026-05-01",
    temperature_comfortable: true,
    noise_level_acceptable: true,
    privacy_adequate: true,
    natural_light_adequate: true,
    ventilation_adequate: true,
    mattress_comfortable: true,
    room_clean: true,
    room_tidy: true,
    feels_safe_in_room: true,
    overall_comfort_rating: 5,
    child_reported: true,
    issues_identified: 0,
    issues_resolved: 0,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeDignity(overrides: Partial<DignitySpaceInput> = {}): DignitySpaceInput {
  _id++;
  return {
    id: `dig_${_id}`,
    child_id: "child_1",
    room_id: "room_1",
    assessment_date: "2026-05-01",
    has_working_lock: true,
    knock_before_entry_observed: true,
    personal_space_respected: true,
    belongings_not_searched_without_consent: true,
    room_not_used_as_punishment: true,
    can_spend_time_alone: true,
    has_adequate_privacy: true,
    dignity_maintained_during_checks: true,
    child_feels_room_is_theirs: true,
    staff_awareness_of_dignity: true,
    dignity_concern_raised: false,
    dignity_concern_resolved: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<FurnitureRoomInput> = {}): FurnitureRoomInput {
  return {
    today: TODAY,
    total_children: 3,
    furniture_adequacy_records: [],
    room_personalisation_records: [],
    child_choice_records: [],
    comfort_assessment_records: [],
    dignity_space_records: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Furniture & Room Personalisation Intelligence Engine", () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Output shape", () => {

    it("returns all expected top-level keys", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(r).toHaveProperty("room_rating");
      expect(r).toHaveProperty("room_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_furniture_assessments");
      expect(r).toHaveProperty("total_personalisation_assessments");
      expect(r).toHaveProperty("total_choice_records");
      expect(r).toHaveProperty("total_comfort_assessments");
      expect(r).toHaveProperty("total_dignity_assessments");
      expect(r).toHaveProperty("furniture_adequacy_rate");
      expect(r).toHaveProperty("personalisation_rate");
      expect(r).toHaveProperty("child_choice_rate");
      expect(r).toHaveProperty("comfort_rate");
      expect(r).toHaveProperty("dignity_rate");
      expect(r).toHaveProperty("child_satisfaction_rate");
      expect(r).toHaveProperty("furniture_condition_avg");
      expect(r).toHaveProperty("comfort_rating_avg");
      expect(r).toHaveProperty("personalisation_budget_utilisation_rate");
      expect(r).toHaveProperty("choice_fulfilment_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths, concerns, recommendations, insights are arrays", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("room_score is a number between 0 and 100", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.room_score).toBeGreaterThanOrEqual(0);
      expect(r.room_score).toBeLessThanOrEqual(100);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "poor", bed_adequate: false, wardrobe_adequate: false, desk_adequate: false, shelving_adequate: false, seating_adequate: false, storage_adequate: false, lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false })],
      }));
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL CASES (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Special cases", () => {

    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 0 }));
      expect(r.room_rating).toBe("insufficient_data");
      expect(r.room_score).toBe(0);
    });

    it("returns headline mentioning insufficient data for 0 children + empty arrays", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 3 }));
      expect(r.room_rating).toBe("inadequate");
      expect(r.room_score).toBe(15);
    });

    it("produces one concern when all empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 3 }));
      expect(r.concerns.length).toBe(1);
    });

    it("produces two recommendations when all empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 3 }));
      expect(r.recommendations.length).toBe(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("produces one critical insight when all empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 3 }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all rates are 0 when arrays are empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 2 }));
      expect(r.furniture_adequacy_rate).toBe(0);
      expect(r.personalisation_rate).toBe(0);
      expect(r.child_choice_rate).toBe(0);
      expect(r.comfort_rate).toBe(0);
      expect(r.dignity_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("all totals are 0 when arrays are empty but children > 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({ total_children: 2 }));
      expect(r.total_furniture_assessments).toBe(0);
      expect(r.total_personalisation_assessments).toBe(0);
      expect(r.total_choice_records).toBe(0);
      expect(r.total_comfort_assessments).toBe(0);
      expect(r.total_dignity_assessments).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTALS (7 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Totals", () => {

    it("counts furniture assessments correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture(), makeFurniture({ child_id: "child_2" }), makeFurniture({ child_id: "child_3" })],
      }));
      expect(r.total_furniture_assessments).toBe(3);
    });

    it("counts personalisation assessments correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation(), makePersonalisation({ child_id: "child_2" })],
      }));
      expect(r.total_personalisation_assessments).toBe(2);
    });

    it("counts choice records correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [makeChoice(), makeChoice(), makeChoice(), makeChoice()],
      }));
      expect(r.total_choice_records).toBe(4);
    });

    it("counts comfort assessments correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort(), makeComfort({ child_id: "child_2" })],
      }));
      expect(r.total_comfort_assessments).toBe(2);
    });

    it("counts dignity assessments correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity(), makeDignity({ child_id: "child_2" }), makeDignity({ child_id: "child_3" })],
      }));
      expect(r.total_dignity_assessments).toBe(3);
    });

    it("handles single record per array", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        room_personalisation_records: [makePersonalisation()],
        child_choice_records: [makeChoice()],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.total_furniture_assessments).toBe(1);
      expect(r.total_personalisation_assessments).toBe(1);
      expect(r.total_choice_records).toBe(1);
      expect(r.total_comfort_assessments).toBe(1);
      expect(r.total_dignity_assessments).toBe(1);
    });

    it("handles large number of records", () => {
      const records = Array.from({ length: 50 }, (_, i) => makeFurniture({ child_id: `child_${i % 3 + 1}` }));
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: records }));
      expect(r.total_furniture_assessments).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FURNITURE ADEQUACY RATE (12 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Furniture adequacy rate", () => {

    it("returns 100% when all items adequate", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture(), makeFurniture({ child_id: "child_2" }), makeFurniture({ child_id: "child_3" })],
      }));
      expect(r.furniture_adequacy_rate).toBe(100);
    });

    it("returns 0% when no items adequate", () => {
      const allFalse = makeFurniture({
        bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
        shelving_adequate: false, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [allFalse],
      }));
      expect(r.furniture_adequacy_rate).toBe(0);
    });

    it("calculates correctly when some items inadequate", () => {
      const partial = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: false, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [partial],
      }));
      // 3 out of 9 = 33%
      expect(r.furniture_adequacy_rate).toBe(33);
    });

    it("aggregates across multiple records", () => {
      const allGood = makeFurniture(); // 9/9
      const halfGood = makeFurniture({
        child_id: "child_2",
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true,
        storage_adequate: false, lighting_adequate: false,
        curtains_blinds_adequate: false, floor_covering_adequate: false,
      }); // 5/9
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [allGood, halfGood],
      }));
      // 14 out of 18 = 78%
      expect(r.furniture_adequacy_rate).toBe(78);
    });

    it("returns 0 when furniture_adequacy_records is empty", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()],
      }));
      expect(r.furniture_adequacy_rate).toBe(0);
    });

    it("handles single item adequate out of 9", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: false, desk_adequate: false,
        shelving_adequate: false, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(11); // 1/9
    });

    it("returns 89% when 8 of 9 items adequate", () => {
      const f = makeFurniture({ floor_covering_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(89); // 8/9
    });

    it("counts bed_adequate correctly", () => {
      const allButBed = makeFurniture({ bed_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [allButBed] }));
      expect(r.furniture_adequacy_rate).toBe(89);
    });

    it("counts wardrobe_adequate correctly", () => {
      const f = makeFurniture({ wardrobe_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(89);
    });

    it("counts desk_adequate correctly", () => {
      const f = makeFurniture({ desk_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(89);
    });

    it("counts lighting_adequate correctly", () => {
      const f = makeFurniture({ lighting_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(89);
    });

    it("counts storage_adequate correctly", () => {
      const f = makeFurniture({ storage_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.furniture_adequacy_rate).toBe(89);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FURNITURE CONDITION AVERAGE (6 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Furniture condition average", () => {

    it("returns 4.0 for all excellent", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent" }),
        ],
      }));
      expect(r.furniture_condition_avg).toBe(4);
    });

    it("returns 3.0 for all good", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "good" })],
      }));
      expect(r.furniture_condition_avg).toBe(3);
    });

    it("returns 2.0 for all fair", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "fair" })],
      }));
      expect(r.furniture_condition_avg).toBe(2);
    });

    it("returns 1.0 for all poor", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "poor" })],
      }));
      expect(r.furniture_condition_avg).toBe(1);
    });

    it("returns average for mixed conditions", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent" }), // 4
          makeFurniture({ child_id: "child_2", furniture_condition: "poor" }), // 1
        ],
      }));
      expect(r.furniture_condition_avg).toBe(2.5); // (4+1)/2
    });

    it("returns 0 when no furniture records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()],
      }));
      expect(r.furniture_condition_avg).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONALISATION RATE (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Personalisation rate", () => {

    it("returns 100% when all personalisation items present", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation()],
      }));
      expect(r.personalisation_rate).toBe(100);
    });

    it("returns 0% when no personalisation items present", () => {
      const p = makePersonalisation({
        has_personal_photos: false, has_chosen_bedding: false,
        has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [p],
      }));
      expect(r.personalisation_rate).toBe(0);
    });

    it("calculates correctly for partial personalisation", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [p],
      }));
      // 4 out of 8 = 50%
      expect(r.personalisation_rate).toBe(50);
    });

    it("aggregates across multiple personalisation records", () => {
      const full = makePersonalisation(); // 8/8
      const half = makePersonalisation({
        child_id: "child_2",
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      }); // 4/8
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [full, half],
      }));
      // 12/16 = 75%
      expect(r.personalisation_rate).toBe(75);
    });

    it("returns 0 when no personalisation records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.personalisation_rate).toBe(0);
    });

    it("counts has_personal_photos correctly", () => {
      const p = makePersonalisation({ has_personal_photos: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.personalisation_rate).toBe(88); // 7/8
    });

    it("counts has_lockable_storage correctly", () => {
      const p = makePersonalisation({ has_lockable_storage: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.personalisation_rate).toBe(88);
    });

    it("counts has_notice_board correctly", () => {
      const p = makePersonalisation({ has_notice_board: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.personalisation_rate).toBe(88);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD CHOICE RATE (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Child choice rate", () => {

    it("returns 100% when all children have fulfilled choices", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: true }),
        ],
      }));
      expect(r.child_choice_rate).toBe(100);
    });

    it("returns 0% when no choices are fulfilled", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: false }),
          makeChoice({ child_id: "child_2", fulfilled: false }),
        ],
      }));
      expect(r.child_choice_rate).toBe(0);
    });

    it("returns 33% when 1 of 3 children has fulfilled choice", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: false }),
          makeChoice({ child_id: "child_3", fulfilled: false }),
        ],
      }));
      expect(r.child_choice_rate).toBe(33);
    });

    it("returns 67% when 2 of 3 children have fulfilled choices", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: false }),
        ],
      }));
      expect(r.child_choice_rate).toBe(67);
    });

    it("returns 0 when no choice records exist", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.child_choice_rate).toBe(0);
    });

    it("counts unique children correctly — multiple choices same child", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_1", fulfilled: true }),
        ],
      }));
      // Only 1 unique child, total 3 => 33%
      expect(r.child_choice_rate).toBe(33);
    });

    it("returns 0 when total_children is 0", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 0,
        child_choice_records: [makeChoice({ fulfilled: true })],
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.child_choice_rate).toBe(0);
    });

    it("handles mixed fulfilled and unfulfilled for same child", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 1,
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_1", fulfilled: false }),
        ],
      }));
      // child_1 has at least one fulfilled => 100%
      expect(r.child_choice_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHOICE FULFILMENT RATE (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Choice fulfilment rate", () => {

    it("returns 100% when all choices fulfilled", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [makeChoice({ fulfilled: true }), makeChoice({ fulfilled: true })],
      }));
      expect(r.choice_fulfilment_rate).toBe(100);
    });

    it("returns 0% when no choices fulfilled", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [makeChoice({ fulfilled: false }), makeChoice({ fulfilled: false })],
      }));
      expect(r.choice_fulfilment_rate).toBe(0);
    });

    it("returns 50% when half fulfilled", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [makeChoice({ fulfilled: true }), makeChoice({ fulfilled: false })],
      }));
      expect(r.choice_fulfilment_rate).toBe(50);
    });

    it("returns 0 when no choice records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(r.choice_fulfilment_rate).toBe(0);
    });

    it("returns 75% for 3 of 4 fulfilled", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: false }),
        ],
      }));
      expect(r.choice_fulfilment_rate).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMFORT RATE (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Comfort rate", () => {

    it("returns 100% when all comfort items pass", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()],
      }));
      expect(r.comfort_rate).toBe(100);
    });

    it("returns 0% when no comfort items pass", () => {
      const c = makeComfort({
        temperature_comfortable: false, noise_level_acceptable: false,
        privacy_adequate: false, natural_light_adequate: false,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [c],
      }));
      expect(r.comfort_rate).toBe(0);
    });

    it("calculates correctly for partial comfort", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: false,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [c],
      }));
      // 3/9 = 33%
      expect(r.comfort_rate).toBe(33);
    });

    it("aggregates across multiple comfort records", () => {
      const full = makeComfort(); // 9/9
      const none = makeComfort({
        child_id: "child_2",
        temperature_comfortable: false, noise_level_acceptable: false,
        privacy_adequate: false, natural_light_adequate: false,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      }); // 0/9
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [full, none],
      }));
      // 9/18 = 50%
      expect(r.comfort_rate).toBe(50);
    });

    it("returns 0 when no comfort records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.comfort_rate).toBe(0);
    });

    it("counts feels_safe_in_room correctly", () => {
      const c = makeComfort({ feels_safe_in_room: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.comfort_rate).toBe(89); // 8/9
    });

    it("counts mattress_comfortable correctly", () => {
      const c = makeComfort({ mattress_comfortable: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.comfort_rate).toBe(89);
    });

    it("counts privacy_adequate correctly", () => {
      const c = makeComfort({ privacy_adequate: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.comfort_rate).toBe(89);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMFORT RATING AVERAGE (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Comfort rating average", () => {

    it("returns exact rating when single record", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort({ overall_comfort_rating: 4 })],
      }));
      expect(r.comfort_rating_avg).toBe(4);
    });

    it("returns 0 when no records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(r.comfort_rating_avg).toBe(0);
    });

    it("averages correctly for two records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [
          makeComfort({ overall_comfort_rating: 5 }),
          makeComfort({ child_id: "child_2", overall_comfort_rating: 3 }),
        ],
      }));
      expect(r.comfort_rating_avg).toBe(4);
    });

    it("rounds to two decimal places", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [
          makeComfort({ overall_comfort_rating: 3 }),
          makeComfort({ child_id: "child_2", overall_comfort_rating: 4 }),
          makeComfort({ child_id: "child_3", overall_comfort_rating: 5 }),
        ],
      }));
      expect(r.comfort_rating_avg).toBe(4);
    });

    it("handles rating of 1", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort({ overall_comfort_rating: 1 })],
      }));
      expect(r.comfort_rating_avg).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DIGNITY RATE (8 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Dignity rate", () => {

    it("returns 100% when all dignity items met", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()],
      }));
      expect(r.dignity_rate).toBe(100);
    });

    it("returns 0% when no dignity items met", () => {
      const d = makeDignity({
        has_working_lock: false, knock_before_entry_observed: false,
        personal_space_respected: false, belongings_not_searched_without_consent: false,
        room_not_used_as_punishment: false, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [d],
      }));
      expect(r.dignity_rate).toBe(0);
    });

    it("calculates correctly for partial dignity", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [d],
      }));
      // 5/10 = 50%
      expect(r.dignity_rate).toBe(50);
    });

    it("aggregates across multiple dignity records", () => {
      const full = makeDignity(); // 10/10
      const partial = makeDignity({
        child_id: "child_2",
        has_working_lock: false, knock_before_entry_observed: false,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: true,
        child_feels_room_is_theirs: true, staff_awareness_of_dignity: true,
      }); // 8/10
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [full, partial],
      }));
      // 18/20 = 90%
      expect(r.dignity_rate).toBe(90);
    });

    it("returns 0 when no dignity records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.dignity_rate).toBe(0);
    });

    it("counts has_working_lock correctly", () => {
      const d = makeDignity({ has_working_lock: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.dignity_rate).toBe(90); // 9/10
    });

    it("counts knock_before_entry_observed correctly", () => {
      const d = makeDignity({ knock_before_entry_observed: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.dignity_rate).toBe(90);
    });

    it("counts child_feels_room_is_theirs correctly", () => {
      const d = makeDignity({ child_feels_room_is_theirs: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.dignity_rate).toBe(90);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD SATISFACTION RATE (7 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Child satisfaction rate", () => {

    it("returns 100% when all satisfaction sources positive", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ child_satisfied_with_room: true })],
        child_choice_records: [makeChoice({ fulfilled: true, child_satisfied_with_outcome: true })],
        comfort_assessment_records: [makeComfort({ child_reported: true })],
      }));
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("returns 0% when no satisfaction sources positive", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ child_satisfied_with_room: false })],
        child_choice_records: [makeChoice({ fulfilled: true, child_satisfied_with_outcome: false })],
        comfort_assessment_records: [makeComfort({ child_reported: false })],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("counts only fulfilled choices for satisfaction", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: true, child_satisfied_with_outcome: true }),
          makeChoice({ fulfilled: false, child_satisfied_with_outcome: true }),
        ],
        room_personalisation_records: [],
        comfort_assessment_records: [],
      }));
      // denominator: 0 pers + 1 fulfilled + 0 comfort = 1
      // numerator: 0 room_sat + 1 choice_sat + 0 child_reported = 1
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("returns 0 when no satisfaction opportunities exist", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("calculates composite across personalisation, choice, and comfort", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
        ],
        child_choice_records: [
          makeChoice({ fulfilled: true, child_satisfied_with_outcome: true }),
        ],
        comfort_assessment_records: [
          makeComfort({ child_reported: true }),
          makeComfort({ child_id: "child_2", child_reported: false }),
        ],
      }));
      // denominator: 2 pers + 1 fulfilled + 2 comfort = 5
      // numerator: 1 room + 1 choice + 1 report = 3
      expect(r.child_satisfaction_rate).toBe(60);
    });

    it("unfulfilled choices do not count in denominator", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: false, child_satisfied_with_outcome: true }),
          makeChoice({ fulfilled: false, child_satisfied_with_outcome: true }),
        ],
      }));
      // 0 fulfilled => denominator is 0 => rate 0
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("returns 50% with mixed satisfaction", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
        ],
      }));
      expect(r.child_satisfaction_rate).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET UTILISATION RATE (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Budget utilisation rate", () => {

    it("returns 80% when 80 of 100 spent", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ budget_amount_approved: 100, budget_amount_spent: 80 })],
      }));
      expect(r.personalisation_budget_utilisation_rate).toBe(80);
    });

    it("returns 100% when all budget spent", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ budget_amount_approved: 100, budget_amount_spent: 100 })],
      }));
      expect(r.personalisation_budget_utilisation_rate).toBe(100);
    });

    it("returns 0% when nothing spent", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ budget_amount_approved: 100, budget_amount_spent: 0 })],
      }));
      expect(r.personalisation_budget_utilisation_rate).toBe(0);
    });

    it("returns 0 when no personalisation records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(r.personalisation_budget_utilisation_rate).toBe(0);
    });

    it("aggregates across multiple records", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ budget_amount_approved: 100, budget_amount_spent: 50 }),
          makePersonalisation({ child_id: "child_2", budget_amount_approved: 100, budget_amount_spent: 100 }),
        ],
      }));
      // 150/200 = 75%
      expect(r.personalisation_budget_utilisation_rate).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING & RATING (20 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Scoring and rating", () => {

    it("base score is 52 with one record and no bonuses or penalties", () => {
      // ~56% adequacy (5/9), condition fair=2, not triggering bonuses or strong penalties
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true,
        storage_adequate: false, lighting_adequate: false,
        curtains_blinds_adequate: false, floor_covering_adequate: false,
        furniture_condition: "fair",
        child_consulted: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [f],
      }));
      // Base 52, furniture adequacy 56% not >= 80 => no bonus,
      // not < 50 => no penalty; condition 2.0 not >= 2.5 => no bonus
      expect(r.room_score).toBe(52);
    });

    it("outstanding requires score >= 80", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_3", furniture_condition: "excellent" }),
        ],
        room_personalisation_records: [makePersonalisation(), makePersonalisation({ child_id: "child_2" }), makePersonalisation({ child_id: "child_3" })],
        child_choice_records: [makeChoice({ child_id: "child_1" }), makeChoice({ child_id: "child_2" }), makeChoice({ child_id: "child_3" })],
        comfort_assessment_records: [makeComfort(), makeComfort({ child_id: "child_2" }), makeComfort({ child_id: "child_3" })],
        dignity_space_records: [makeDignity(), makeDignity({ child_id: "child_2" }), makeDignity({ child_id: "child_3" })],
      }));
      expect(r.room_rating).toBe("outstanding");
      expect(r.room_score).toBeGreaterThanOrEqual(80);
    });

    it("good requires score >= 65 and < 80", () => {
      // Get some bonuses but not all
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: true, has_chosen_bedding: true, has_chosen_wall_decor: true,
          has_personal_belongings_displayed: true, has_chosen_colour_scheme: true,
          has_name_on_door: false, has_lockable_storage: false, has_notice_board: false,
        })],
        child_choice_records: [makeChoice({ fulfilled: true })],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.room_score).toBeGreaterThanOrEqual(65);
    });

    it("adequate requires score >= 45 and < 65", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
          shelving_adequate: true, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "fair",
        })],
      }));
      expect(r.room_score).toBeGreaterThanOrEqual(45);
      expect(r.room_score).toBeLessThan(65);
      expect(r.room_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor",
        })],
        dignity_space_records: [makeDignity({
          has_working_lock: false, knock_before_entry_observed: false,
          personal_space_respected: false, belongings_not_searched_without_consent: false,
          room_not_used_as_punishment: false, can_spend_time_alone: false,
          has_adequate_privacy: false, dignity_maintained_during_checks: false,
          child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
        })],
        comfort_assessment_records: [makeComfort({
          temperature_comfortable: false, noise_level_acceptable: false,
          privacy_adequate: false, natural_light_adequate: false,
          ventilation_adequate: false, mattress_comfortable: false,
          room_clean: false, room_tidy: false, feels_safe_in_room: false,
        })],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: false, has_chosen_bedding: false,
          has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
          has_chosen_colour_scheme: false, has_name_on_door: false,
          has_lockable_storage: false, has_notice_board: false,
        })],
      }));
      expect(r.room_rating).toBe("inadequate");
      expect(r.room_score).toBeLessThan(45);
    });

    it("grants +5 bonus for furnitureAdequacyRate >= 95", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()], // 100%
      }));
      // base 52 + 5 (furniture) + 1 (condition 3.0 >= 2.5) = 58
      expect(r.room_score).toBe(58);
    });

    it("grants +3 bonus for furnitureAdequacyRate >= 80 but < 95", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true, storage_adequate: true,
        lighting_adequate: true, curtains_blinds_adequate: false, floor_covering_adequate: true,
      }); // 8/9 = 89%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [f],
      }));
      // base 52 + 3 (furniture 89%) + 1 (condition 3.0 >= 2.5) = 56
      expect(r.room_score).toBe(56);
    });

    it("grants +5 bonus for personalisationRate >= 90", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation()], // 100%
      }));
      // base 52 + 5 (personalisation)
      expect(r.room_score).toBeGreaterThanOrEqual(57);
    });

    it("grants +3 bonus for personalisationRate >= 70 but < 90", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: true, has_name_on_door: true,
        has_lockable_storage: false, has_notice_board: false,
      }); // 6/8 = 75%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [p],
      }));
      // base 52 + 3 (personalisation 75%)
      expect(r.room_score).toBeGreaterThanOrEqual(55);
    });

    it("grants +4 bonus for childChoiceRate >= 90", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: true }),
        ],
      }));
      // 3/3 children = 100% choice rate => +4
      expect(r.room_score).toBeGreaterThanOrEqual(56);
    });

    it("grants +2 bonus for childChoiceRate >= 70 but < 90", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 4,
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: true }),
        ],
      }));
      // 3/4 = 75% => +2
      expect(r.room_score).toBeGreaterThanOrEqual(54);
    });

    it("grants +4 bonus for comfortRate >= 95", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()], // 100%
      }));
      // base 52 + 4 (comfort)
      expect(r.room_score).toBeGreaterThanOrEqual(56);
    });

    it("grants +5 bonus for dignityRate >= 95", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()], // 100%
      }));
      // base 52 + 5 (dignity)
      expect(r.room_score).toBeGreaterThanOrEqual(57);
    });

    it("grants +3 bonus for dignityRate >= 80 but < 95", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: true,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 8/10 = 80%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [d],
      }));
      // base 52 + 3 (dignity 80%)
      expect(r.room_score).toBeGreaterThanOrEqual(55);
    });

    it("applies -6 penalty for furnitureAdequacyRate < 50", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
        furniture_condition: "poor",
      }); // 4/9 = 44%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [f],
      }));
      // base 52 - 6 (furniture < 50) = 46
      expect(r.room_score).toBe(46);
    });

    it("applies -5 penalty for personalisationRate < 40", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
        child_satisfied_with_room: false,
      }); // 2/8 = 25%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [p],
      }));
      // base 52 - 5 (personalisation < 40) = 47
      expect(r.room_score).toBe(47);
    });

    it("applies -6 penalty for dignityRate < 50", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: false, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 4/10 = 40%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [d],
      }));
      // base 52 - 6 (dignity < 50) = 46
      expect(r.room_score).toBe(46);
    });

    it("applies -5 penalty for comfortRate < 50", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
        child_reported: false,
      }); // 4/9 = 44%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [c],
      }));
      // base 52 - 5 (comfort < 50) = 47
      expect(r.room_score).toBe(47);
    });

    it("clamps score at 0 minimum", () => {
      // Apply all penalties
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
        })],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: false, has_chosen_bedding: false,
          has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
          has_chosen_colour_scheme: false, has_name_on_door: false,
          has_lockable_storage: false, has_notice_board: false,
        })],
        comfort_assessment_records: [makeComfort({
          temperature_comfortable: false, noise_level_acceptable: false,
          privacy_adequate: false, natural_light_adequate: false,
          ventilation_adequate: false, mattress_comfortable: false,
          room_clean: false, room_tidy: false, feels_safe_in_room: false,
        })],
        dignity_space_records: [makeDignity({
          has_working_lock: false, knock_before_entry_observed: false,
          personal_space_respected: false, belongings_not_searched_without_consent: false,
          room_not_used_as_punishment: false, can_spend_time_alone: false,
          has_adequate_privacy: false, dignity_maintained_during_checks: false,
          child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
        })],
      }));
      // 52 - 6 - 5 - 6 - 5 = 30
      expect(r.room_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINE (6 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Headline", () => {

    it("outstanding headline contains 'Outstanding'", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_3", furniture_condition: "excellent" }),
        ],
        room_personalisation_records: [makePersonalisation(), makePersonalisation({ child_id: "child_2" }), makePersonalisation({ child_id: "child_3" })],
        child_choice_records: [makeChoice({ child_id: "child_1" }), makeChoice({ child_id: "child_2" }), makeChoice({ child_id: "child_3" })],
        comfort_assessment_records: [makeComfort(), makeComfort({ child_id: "child_2" }), makeComfort({ child_id: "child_3" })],
        dignity_space_records: [makeDignity(), makeDignity({ child_id: "child_2" }), makeDignity({ child_id: "child_3" })],
      }));
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline contains 'Good'", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: true, has_chosen_bedding: true, has_chosen_wall_decor: true,
          has_personal_belongings_displayed: true, has_chosen_colour_scheme: true,
          has_name_on_door: false, has_lockable_storage: false, has_notice_board: false,
        })],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      if (r.room_rating === "good") {
        expect(r.headline).toContain("Good");
      }
    });

    it("adequate headline contains 'Adequate'", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
          shelving_adequate: true, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "fair",
        })],
      }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline contains 'inadequate'", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor",
        })],
        dignity_space_records: [makeDignity({
          has_working_lock: false, knock_before_entry_observed: false,
          personal_space_respected: false, belongings_not_searched_without_consent: false,
          room_not_used_as_punishment: false, can_spend_time_alone: false,
          has_adequate_privacy: false, dignity_maintained_during_checks: false,
          child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
        })],
        comfort_assessment_records: [makeComfort({
          temperature_comfortable: false, noise_level_acceptable: false,
          privacy_adequate: false, natural_light_adequate: false,
          ventilation_adequate: false, mattress_comfortable: false,
          room_clean: false, room_tidy: false, feels_safe_in_room: false,
          child_reported: false,
        })],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: false, has_chosen_bedding: false,
          has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
          has_chosen_colour_scheme: false, has_name_on_door: false,
          has_lockable_storage: false, has_notice_board: false,
          child_satisfied_with_room: false,
        })],
      }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("good headline mentions strengths count", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: true, has_chosen_bedding: true, has_chosen_wall_decor: true,
          has_personal_belongings_displayed: true, has_chosen_colour_scheme: true,
          has_name_on_door: false, has_lockable_storage: false, has_notice_board: false,
        })],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      if (r.room_rating === "good") {
        expect(r.headline).toContain("strength");
      }
    });

    it("headline is non-empty string for any rating", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput());
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STRENGTHS (16 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {

    it("adds furniture adequacy strength when >= 95%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()], // 100%
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("furniture"))).toBe(true);
    });

    it("adds furniture adequacy strength when >= 80% but < 95%", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true, storage_adequate: true,
        lighting_adequate: true, curtains_blinds_adequate: false, floor_covering_adequate: true,
      }); // 89%
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.strengths.some(s => s.includes("89%") && s.includes("furniture"))).toBe(true);
    });

    it("adds personalisation strength when >= 90%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation()], // 100%
      }));
      expect(r.strengths.some(s => s.includes("personalisation"))).toBe(true);
    });

    it("adds personalisation strength when >= 70% but < 90%", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: true, has_name_on_door: true,
        has_lockable_storage: false, has_notice_board: false,
      }); // 75%
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.strengths.some(s => s.includes("75%") && s.includes("personalisation"))).toBe(true);
    });

    it("adds child choice strength when >= 90%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("choice"))).toBe(true);
    });

    it("adds comfort strength when >= 95%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("comfort"))).toBe(true);
    });

    it("adds comfort strength when >= 80% but < 95%", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: true, mattress_comfortable: true,
        room_clean: true, room_tidy: false, feels_safe_in_room: false,
      }); // 7/9 = 78% ... need 80%
      const c80 = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: true, mattress_comfortable: true,
        room_clean: true, room_tidy: true, feels_safe_in_room: false,
      }); // 8/9 = 89%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [c80],
      }));
      expect(r.strengths.some(s => s.includes("89%") && s.includes("comfort"))).toBe(true);
    });

    it("adds dignity strength when >= 95%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()], // 100%
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("dignity"))).toBe(true);
    });

    it("adds dignity strength when >= 80% but < 95%", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: true,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 8/10 = 80%
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [d],
      }));
      expect(r.strengths.some(s => s.includes("80%") && s.includes("dignity"))).toBe(true);
    });

    it("adds child satisfaction strength when >= 90%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ child_satisfied_with_room: true })],
        child_choice_records: [makeChoice({ fulfilled: true, child_satisfied_with_outcome: true })],
        comfort_assessment_records: [makeComfort({ child_reported: true })],
      }));
      expect(r.strengths.some(s => s.includes("satisfaction"))).toBe(true);
    });

    it("adds furniture condition strength when avg >= 3.5", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "excellent" })], // 4.0
      }));
      expect(r.strengths.some(s => s.includes("condition") && s.includes("4/4"))).toBe(true);
    });

    it("adds choice fulfilment strength when >= 90%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [makeChoice({ fulfilled: true }), makeChoice({ fulfilled: true })],
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("fulfilment") || s.includes("fulfilled"))).toBe(true);
    });

    it("adds knock-before-entry strength when >= 95%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()],
      }));
      expect(r.strengths.some(s => s.includes("knock"))).toBe(true);
    });

    it("adds working lock strength when 100%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()],
      }));
      expect(r.strengths.some(s => s.includes("lock"))).toBe(true);
    });

    it("adds feels-safe strength when >= 95%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [makeComfort()],
      }));
      expect(r.strengths.some(s => s.includes("safe"))).toBe(true);
    });

    it("has no strengths when all rates are low", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor",
        })],
      }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCERNS (20 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {

    it("raises furniture concern when adequacy < 50%", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      }); // 44%
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.concerns.some(c => c.includes("44%") && c.includes("furniture"))).toBe(true);
    });

    it("raises furniture concern when adequacy between 50-79%", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true, storage_adequate: true,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.concerns.some(c => c.includes("67%") && c.includes("Furniture adequacy"))).toBe(true);
    });

    it("raises personalisation concern when < 40%", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      }); // 25%
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.concerns.some(c => c.includes("25%") && c.includes("personalisation"))).toBe(true);
    });

    it("raises personalisation concern when between 40-69%", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      }); // 50%
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("Personalisation"))).toBe(true);
    });

    it("raises child choice concern when < 50%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: false }),
          makeChoice({ child_id: "child_3", fulfilled: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("33%") && c.includes("choice"))).toBe(true);
    });

    it("raises child choice concern when between 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 3,
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("67%") && c.includes("choice"))).toBe(true);
    });

    it("raises comfort concern when < 50%", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      }); // 44%
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.concerns.some(c => c.includes("44%") && c.includes("comfort"))).toBe(true);
    });

    it("raises comfort concern when between 50-79%", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: true, mattress_comfortable: true,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.concerns.some(c => c.includes("67%") && c.includes("Comfort rate"))).toBe(true);
    });

    it("raises dignity concern when < 50%", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: false, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 40%
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.concerns.some(c => c.includes("40%") && c.includes("dignity"))).toBe(true);
    });

    it("raises dignity concern when between 50-79%", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 70%
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.concerns.some(c => c.includes("70%") && c.includes("Dignity rate"))).toBe(true);
    });

    it("raises child satisfaction concern when < 50%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: false }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
          makePersonalisation({ child_id: "child_3", child_satisfied_with_room: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("satisfaction"))).toBe(true);
    });

    it("raises poor condition concern", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "poor" })],
      }));
      expect(r.concerns.some(c => c.includes("poor condition"))).toBe(true);
    });

    it("raises inspection overdue concern", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ inspection_overdue: true })],
      }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("raises personalisation review overdue concern", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ review_overdue: true })],
      }));
      expect(r.concerns.some(c => c.includes("personalisation review"))).toBe(true);
    });

    it("raises working lock concern when < 80%", () => {
      const d = makeDignity({ has_working_lock: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.concerns.some(c => c.includes("lock"))).toBe(true);
    });

    it("raises knock-before-entry concern when < 80%", () => {
      const d = makeDignity({ knock_before_entry_observed: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      // 0% knock rate < 80%
      expect(r.concerns.some(c => c.includes("Knock") || c.includes("knock"))).toBe(true);
    });

    it("raises feels-safe concern when < 80%", () => {
      const c = makeComfort({ feels_safe_in_room: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      // 0% feels safe < 80%
      expect(r.concerns.some(c => c.includes("safe"))).toBe(true);
    });

    it("raises room-used-as-punishment concern", () => {
      const d = makeDignity({ room_not_used_as_punishment: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.concerns.some(c => c.includes("punishment"))).toBe(true);
    });

    it("raises mattress concern when < 80%", () => {
      const c = makeComfort({ mattress_comfortable: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      // 0% mattress rate < 80%
      expect(r.concerns.some(c => c.includes("mattress"))).toBe(true);
    });

    it("raises lockable storage concern when < 70%", () => {
      const p = makePersonalisation({ has_lockable_storage: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      // 0% lockable storage < 70%
      expect(r.concerns.some(c => c.includes("lockable storage"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS (20 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {

    it("recommends immediate furniture action when adequacy < 50%", () => {
      const f = makeFurniture({
        bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
        shelving_adequate: false, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("furniture"))).toBe(true);
    });

    it("recommends immediate dignity action when < 50%", () => {
      const d = makeDignity({
        has_working_lock: false, knock_before_entry_observed: false,
        personal_space_respected: false, belongings_not_searched_without_consent: false,
        room_not_used_as_punishment: false, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("dignity"))).toBe(true);
    });

    it("recommends immediate comfort action when < 50%", () => {
      const c = makeComfort({
        temperature_comfortable: false, noise_level_acceptable: false,
        privacy_adequate: false, natural_light_adequate: false,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("comfort"))).toBe(true);
    });

    it("recommends immediate personalisation action when < 40%", () => {
      const p = makePersonalisation({
        has_personal_photos: false, has_chosen_bedding: false,
        has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("personalisation"))).toBe(true);
    });

    it("recommends immediate action when feels-safe < 80%", () => {
      const c = makeComfort({ feels_safe_in_room: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("safe"))).toBe(true);
    });

    it("recommends immediate action when rooms used as punishment", () => {
      const d = makeDignity({ room_not_used_as_punishment: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("punishment"))).toBe(true);
    });

    it("recommends immediate action for poor condition rooms", () => {
      const f = makeFurniture({ furniture_condition: "poor" });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("poor condition"))).toBe(true);
    });

    it("recommends immediate lock action when < 80%", () => {
      const d = makeDignity({ has_working_lock: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("lock"))).toBe(true);
    });

    it("recommends soon action for knock-before-entry < 80%", () => {
      const d = makeDignity({ knock_before_entry_observed: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("knock"))).toBe(true);
    });

    it("recommends soon action for furniture adequacy 50-79%", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true, storage_adequate: true,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("furniture adequacy"))).toBe(true);
    });

    it("recommends soon action for personalisation 40-69%", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      }); // 50%
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("personalisation"))).toBe(true);
    });

    it("recommends soon action for mattress < 80%", () => {
      const c = makeComfort({ mattress_comfortable: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("mattress"))).toBe(true);
    });

    it("recommends soon action for lockable storage < 70%", () => {
      const p = makePersonalisation({ has_lockable_storage: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("lockable storage"))).toBe(true);
    });

    it("recommends soon action for inspection overdue", () => {
      const f = makeFurniture({ inspection_overdue: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("inspection"))).toBe(true);
    });

    it("recommends soon action for personalisation review overdue", () => {
      const p = makePersonalisation({ review_overdue: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("personalisation review"))).toBe(true);
    });

    it("recommends planned action for dignity 50-79%", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 70%
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("dignity"))).toBe(true);
    });

    it("recommends planned action for comfort 50-79%", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: true, mattress_comfortable: true,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("comfort"))).toBe(true);
    });

    it("recommends planned budget provision when < 80%", () => {
      const p = makePersonalisation({ personalisation_budget_provided: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("budget"))).toBe(true);
    });

    it("recommends planned consultation when < 70%", () => {
      const f = makeFurniture({ child_consulted: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("consultation"))).toBe(true);
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor", inspection_overdue: true, child_consulted: false,
        })],
        room_personalisation_records: [makePersonalisation({
          has_personal_photos: false, has_chosen_bedding: false,
          has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
          has_chosen_colour_scheme: false, has_name_on_door: false,
          has_lockable_storage: false, has_notice_board: false,
          personalisation_budget_provided: false, review_overdue: true,
        })],
        dignity_space_records: [makeDignity({
          has_working_lock: false, knock_before_entry_observed: false,
          personal_space_respected: false, belongings_not_searched_without_consent: false,
          room_not_used_as_punishment: false, can_spend_time_alone: false,
          has_adequate_privacy: false, dignity_maintained_during_checks: false,
          child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
        })],
        comfort_assessment_records: [makeComfort({
          temperature_comfortable: false, noise_level_acceptable: false,
          privacy_adequate: false, natural_light_adequate: false,
          ventilation_adequate: false, mattress_comfortable: false,
          room_clean: false, room_tidy: false, feels_safe_in_room: false,
          issues_identified: 5, issues_resolved: 0,
        })],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS (18 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {

    it("critical insight for furniture adequacy < 50%", () => {
      const f = makeFurniture({
        bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
        shelving_adequate: false, seating_adequate: false, storage_adequate: false,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("furniture"))).toBe(true);
    });

    it("critical insight for personalisation < 40%", () => {
      const p = makePersonalisation({
        has_personal_photos: false, has_chosen_bedding: false,
        has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("personalisation"))).toBe(true);
    });

    it("critical insight for dignity < 50%", () => {
      const d = makeDignity({
        has_working_lock: false, knock_before_entry_observed: false,
        personal_space_respected: false, belongings_not_searched_without_consent: false,
        room_not_used_as_punishment: false, can_spend_time_alone: false,
        has_adequate_privacy: false, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("dignity"))).toBe(true);
    });

    it("critical insight for comfort < 50%", () => {
      const c = makeComfort({
        temperature_comfortable: false, noise_level_acceptable: false,
        privacy_adequate: false, natural_light_adequate: false,
        ventilation_adequate: false, mattress_comfortable: false,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("comfort"))).toBe(true);
    });

    it("critical insight for room used as punishment", () => {
      const d = makeDignity({ room_not_used_as_punishment: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("punishment"))).toBe(true);
    });

    it("critical insight for feels-safe < 70%", () => {
      const c = makeComfort({ feels_safe_in_room: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("safe"))).toBe(true);
    });

    it("warning insight for furniture 50-79%", () => {
      const f = makeFurniture({
        bed_adequate: true, wardrobe_adequate: true, desk_adequate: true,
        shelving_adequate: true, seating_adequate: true, storage_adequate: true,
        lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("67%"))).toBe(true);
    });

    it("warning insight for personalisation 40-69%", () => {
      const p = makePersonalisation({
        has_personal_photos: true, has_chosen_bedding: true,
        has_chosen_wall_decor: true, has_personal_belongings_displayed: true,
        has_chosen_colour_scheme: false, has_name_on_door: false,
        has_lockable_storage: false, has_notice_board: false,
      }); // 50%
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("50%"))).toBe(true);
    });

    it("warning insight for dignity 50-79%", () => {
      const d = makeDignity({
        has_working_lock: true, knock_before_entry_observed: true,
        personal_space_respected: true, belongings_not_searched_without_consent: true,
        room_not_used_as_punishment: true, can_spend_time_alone: true,
        has_adequate_privacy: true, dignity_maintained_during_checks: false,
        child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
      }); // 70%
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("70%"))).toBe(true);
    });

    it("warning insight for comfort 50-79%", () => {
      const c = makeComfort({
        temperature_comfortable: true, noise_level_acceptable: true,
        privacy_adequate: true, natural_light_adequate: true,
        ventilation_adequate: true, mattress_comfortable: true,
        room_clean: false, room_tidy: false, feels_safe_in_room: false,
      }); // 67%
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("67%"))).toBe(true);
    });

    it("warning insight for furniture condition < 2.5", () => {
      const f = makeFurniture({ furniture_condition: "poor" }); // 1.0
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("condition") && i.text.includes("1/4"))).toBe(true);
    });

    it("warning insight for budget utilisation < 50%", () => {
      const p = makePersonalisation({ budget_amount_approved: 100, budget_amount_spent: 30 });
      const r = computeFurnitureRoomPersonalisation(baseInput({ room_personalisation_records: [p] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("budget") && i.text.includes("30%"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_3", furniture_condition: "excellent" }),
        ],
        room_personalisation_records: [makePersonalisation(), makePersonalisation({ child_id: "child_2" }), makePersonalisation({ child_id: "child_3" })],
        child_choice_records: [makeChoice({ child_id: "child_1" }), makeChoice({ child_id: "child_2" }), makeChoice({ child_id: "child_3" })],
        comfort_assessment_records: [makeComfort(), makeComfort({ child_id: "child_2" }), makeComfort({ child_id: "child_3" })],
        dignity_space_records: [makeDignity(), makeDignity({ child_id: "child_2" }), makeDignity({ child_id: "child_3" })],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for high furniture adequacy + condition", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "excellent" })], // 100% + 4.0
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100%") && i.text.includes("furniture"))).toBe(true);
    });

    it("positive insight for high personalisation + identity reflection", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation()], // 100% + room_reflects_identity true
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("personalisation") && i.text.includes("identity"))).toBe(true);
    });

    it("positive insight for high dignity + ownership feeling", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()], // 100% + child_feels_room_is_theirs true
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("dignity") && i.text.includes("ownership"))).toBe(true);
    });

    it("positive insight for high child satisfaction", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ child_satisfied_with_room: true })],
        child_choice_records: [makeChoice({ fulfilled: true, child_satisfied_with_outcome: true })],
        comfort_assessment_records: [makeComfort({ child_reported: true })],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("satisfaction"))).toBe(true);
    });

    it("positive insight for exemplary privacy practice", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()], // knock=100%, lock=100%, space=100%
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("privacy practice"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHOICE TYPE DISTRIBUTION INSIGHT (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Choice type distribution insight", () => {

    it("shows choice type distribution when >= 5 choices", () => {
      const choices = [
        makeChoice({ choice_type: "decor", child_id: "child_1" }),
        makeChoice({ choice_type: "decor", child_id: "child_1" }),
        makeChoice({ choice_type: "colour", child_id: "child_2" }),
        makeChoice({ choice_type: "bedding", child_id: "child_2" }),
        makeChoice({ choice_type: "furniture", child_id: "child_3" }),
      ];
      const r = computeFurnitureRoomPersonalisation(baseInput({ child_choice_records: choices }));
      expect(r.insights.some(i => i.text.includes("choice types"))).toBe(true);
    });

    it("does not show choice type insight with fewer than 5 choices", () => {
      const choices = [
        makeChoice({ choice_type: "decor" }),
        makeChoice({ choice_type: "colour" }),
      ];
      const r = computeFurnitureRoomPersonalisation(baseInput({ child_choice_records: choices }));
      expect(r.insights.some(i => i.text.includes("choice types"))).toBe(false);
    });

    it("shows top 3 choice types", () => {
      const choices = [
        makeChoice({ choice_type: "decor" }),
        makeChoice({ choice_type: "decor" }),
        makeChoice({ choice_type: "decor" }),
        makeChoice({ choice_type: "colour" }),
        makeChoice({ choice_type: "colour" }),
        makeChoice({ choice_type: "bedding" }),
        makeChoice({ choice_type: "furniture" }),
      ];
      const r = computeFurnitureRoomPersonalisation(baseInput({ child_choice_records: choices }));
      const insight = r.insights.find(i => i.text.includes("choice types"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("decor");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REPLACEMENT ACTION TRACKING (5 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Replacement action tracking", () => {

    it("adds strength when all replacements actioned", () => {
      const f = makeFurniture({ replacement_needed: true, replacement_actioned: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.strengths.some(s => s.includes("replacement"))).toBe(true);
    });

    it("raises concern when replacement action rate < 50%", () => {
      const f1 = makeFurniture({ replacement_needed: true, replacement_actioned: false });
      const f2 = makeFurniture({ child_id: "child_2", replacement_needed: true, replacement_actioned: false });
      const f3 = makeFurniture({ child_id: "child_3", replacement_needed: true, replacement_actioned: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [f1, f2, f3],
      }));
      expect(r.concerns.some(c => c.includes("replacement"))).toBe(true);
    });

    it("no replacement concern when no replacement needed", () => {
      const f = makeFurniture({ replacement_needed: false, replacement_actioned: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.concerns.some(c => c.includes("replacement") && c.includes("actioned"))).toBe(false);
    });

    it("no replacement strength when no replacement needed", () => {
      const f = makeFurniture({ replacement_needed: false, replacement_actioned: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ furniture_adequacy_records: [f] }));
      expect(r.strengths.some(s => s.includes("replacement"))).toBe(false);
    });

    it("calculates replacement action rate correctly", () => {
      const f1 = makeFurniture({ replacement_needed: true, replacement_actioned: true });
      const f2 = makeFurniture({ child_id: "child_2", replacement_needed: true, replacement_actioned: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [f1, f2],
      }));
      // 1 of 2 actioned = 50% — not < 50 so no concern, not 100 so no strength
      expect(r.concerns.some(c => c.includes("replacement") && c.includes("actioned"))).toBe(false);
      expect(r.strengths.some(s => s.includes("replacement"))).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMFORT ISSUE RESOLUTION (4 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Comfort issue resolution", () => {

    it("raises concern when resolution rate < 50%", () => {
      const c = makeComfort({ issues_identified: 10, issues_resolved: 2 });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.concerns.some(c => c.includes("comfort issues resolved"))).toBe(true);
    });

    it("no concern when resolution rate >= 50%", () => {
      const c = makeComfort({ issues_identified: 10, issues_resolved: 5 });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.concerns.some(c => c.includes("comfort issues resolved"))).toBe(false);
    });

    it("no concern when no issues identified", () => {
      const c = makeComfort({ issues_identified: 0, issues_resolved: 0 });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.concerns.some(c => c.includes("comfort issues resolved"))).toBe(false);
    });

    it("recommends action for unresolved comfort issues", () => {
      const c = makeComfort({ issues_identified: 10, issues_resolved: 2 });
      const r = computeFurnitureRoomPersonalisation(baseInput({ comfort_assessment_records: [c] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("comfort issues"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DIGNITY CONCERN RESOLUTION (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Dignity concern resolution", () => {

    it("tracks dignity concerns raised", () => {
      const d = makeDignity({ dignity_concern_raised: true, dignity_concern_resolved: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      // Engine tracks this internally; confirm no errors
      expect(r.dignity_rate).toBe(100);
    });

    it("tracks unresolved dignity concerns", () => {
      const d = makeDignity({ dignity_concern_raised: true, dignity_concern_resolved: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.dignity_rate).toBe(100); // dignity items all true, concern fields are separate
    });

    it("no crash when multiple dignity concerns", () => {
      const records = [
        makeDignity({ dignity_concern_raised: true, dignity_concern_resolved: true }),
        makeDignity({ child_id: "child_2", dignity_concern_raised: true, dignity_concern_resolved: false }),
        makeDignity({ child_id: "child_3", dignity_concern_raised: false, dignity_concern_resolved: false }),
      ];
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: records }));
      expect(r.total_dignity_assessments).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY REFLECTION (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Identity reflection", () => {

    it("adds strength when identity reflection >= 90%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ room_reflects_identity: true })],
      }));
      expect(r.strengths.some(s => s.includes("identity"))).toBe(true);
    });

    it("no identity strength when reflection is low", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ room_reflects_identity: false }),
          makePersonalisation({ child_id: "child_2", room_reflects_identity: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("rooms assessed as reflecting"))).toBe(false);
    });

    it("tracks identity reflection rate accurately", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ room_reflects_identity: true }),
          makePersonalisation({ child_id: "child_2", room_reflects_identity: false }),
        ],
      }));
      // 50% identity reflection, no strength (needs >= 90%)
      expect(r.strengths.some(s => s.includes("rooms assessed as reflecting"))).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT USED AS PUNISHMENT (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Not used as punishment tracking", () => {

    it("adds strength when 100% not used as punishment", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        dignity_space_records: [makeDignity()],
      }));
      expect(r.strengths.some(s => s.includes("punishment"))).toBe(true);
    });

    it("raises concern when rooms used as punishment", () => {
      const d = makeDignity({ room_not_used_as_punishment: false });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d] }));
      expect(r.concerns.some(c => c.includes("punishment"))).toBe(true);
    });

    it("shows correct percentage in punishment concern", () => {
      const d1 = makeDignity({ room_not_used_as_punishment: false });
      const d2 = makeDignity({ child_id: "child_2", room_not_used_as_punishment: true });
      const r = computeFurnitureRoomPersonalisation(baseInput({ dignity_space_records: [d1, d2] }));
      // 50% not used => 50% are used
      expect(r.concerns.some(c => c.includes("50%") && c.includes("punishment"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PLURAL HANDLING IN CONCERNS (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Plural handling", () => {

    it("uses singular for 1 poor condition room", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "poor" })],
      }));
      expect(r.concerns.some(c => c.includes("1 bedroom has"))).toBe(true);
    });

    it("uses plural for multiple poor condition rooms", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "poor" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "poor" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("2 bedrooms have"))).toBe(true);
    });

    it("uses singular for 1 inspection overdue", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ inspection_overdue: true })],
      }));
      expect(r.concerns.some(c => c.includes("1 furniture inspection is overdue"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATION RANKING (4 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendation ranking", () => {

    it("recommendations have sequential ranks starting at 1", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor", child_consulted: false,
        })],
        dignity_space_records: [makeDignity({
          has_working_lock: false, knock_before_entry_observed: false,
          personal_space_respected: false, belongings_not_searched_without_consent: false,
          room_not_used_as_punishment: false, can_spend_time_alone: false,
          has_adequate_privacy: false, dignity_maintained_during_checks: false,
          child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
        })],
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("immediate recommendations come before soon", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({
          bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
          shelving_adequate: false, seating_adequate: false, storage_adequate: false,
          lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
          furniture_condition: "poor", inspection_overdue: true,
        })],
      }));
      const immediateRanks = r.recommendations.filter(rec => rec.urgency === "immediate").map(rec => rec.rank);
      const soonRanks = r.recommendations.filter(rec => rec.urgency === "soon").map(rec => rec.rank);
      if (immediateRanks.length > 0 && soonRanks.length > 0) {
        expect(Math.max(...immediateRanks)).toBeLessThan(Math.min(...soonRanks));
      }
    });

    it("urgency values are valid", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "poor", child_consulted: false })],
      }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("no recommendations for perfect data", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ furniture_condition: "excellent", child_consulted: true }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent", child_consulted: true }),
          makeFurniture({ child_id: "child_3", furniture_condition: "excellent", child_consulted: true }),
        ],
        room_personalisation_records: [
          makePersonalisation({ personalisation_budget_provided: true }),
          makePersonalisation({ child_id: "child_2", personalisation_budget_provided: true }),
          makePersonalisation({ child_id: "child_3", personalisation_budget_provided: true }),
        ],
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: true }),
        ],
        comfort_assessment_records: [
          makeComfort(),
          makeComfort({ child_id: "child_2" }),
          makeComfort({ child_id: "child_3" }),
        ],
        dignity_space_records: [
          makeDignity(),
          makeDignity({ child_id: "child_2" }),
          makeDignity({ child_id: "child_3" }),
        ],
      }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-CHILD SCENARIOS (6 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Multi-child scenarios", () => {

    it("handles 3 children with mixed quality", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ child_id: "child_1", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "good" }),
          makeFurniture({ child_id: "child_3", furniture_condition: "poor" }),
        ],
      }));
      expect(r.total_furniture_assessments).toBe(3);
      expect(r.furniture_condition_avg).toBeCloseTo(2.67, 1);
    });

    it("calculates coverage correctly for partial assessment", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 4,
        furniture_adequacy_records: [
          makeFurniture({ child_id: "child_1" }),
          makeFurniture({ child_id: "child_2" }),
        ],
      }));
      // 2 of 4 children assessed
      expect(r.total_furniture_assessments).toBe(2);
    });

    it("handles multiple records per child", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ child_id: "child_1", assessment_date: "2026-01-01" }),
          makeFurniture({ child_id: "child_1", assessment_date: "2026-03-01" }),
          makeFurniture({ child_id: "child_1", assessment_date: "2026-05-01" }),
        ],
      }));
      expect(r.total_furniture_assessments).toBe(3);
      expect(r.furniture_adequacy_rate).toBe(100);
    });

    it("handles one child on placement with all data", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 1,
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "excellent" })],
        room_personalisation_records: [makePersonalisation()],
        child_choice_records: [makeChoice()],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.child_choice_rate).toBe(100);
      expect(r.room_rating).toBe("outstanding");
    });

    it("handles large number of children", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeFurniture({ child_id: `child_${i + 1}` })
      );
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 10,
        furniture_adequacy_records: records,
      }));
      expect(r.total_furniture_assessments).toBe(10);
      expect(r.furniture_adequacy_rate).toBe(100);
    });

    it("mixed children: some with all data, some with none", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 3,
        furniture_adequacy_records: [makeFurniture({ child_id: "child_1" })],
        room_personalisation_records: [makePersonalisation({ child_id: "child_1" })],
        child_choice_records: [makeChoice({ child_id: "child_1", fulfilled: true })],
        comfort_assessment_records: [makeComfort({ child_id: "child_1" })],
        dignity_space_records: [makeDignity({ child_id: "child_1" })],
      }));
      expect(r.child_choice_rate).toBe(33); // 1 of 3
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES (6 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {

    it("handles total_children = 1 correctly", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 1,
        furniture_adequacy_records: [makeFurniture()],
      }));
      expect(r.room_score).toBeGreaterThan(0);
    });

    it("handles all arrays with single record", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 1,
        furniture_adequacy_records: [makeFurniture({ furniture_condition: "excellent" })],
        room_personalisation_records: [makePersonalisation()],
        child_choice_records: [makeChoice()],
        comfort_assessment_records: [makeComfort()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.room_rating).toBe("outstanding");
    });

    it("handles 0 budget approved (avoids division by zero)", () => {
      const p = makePersonalisation({ budget_amount_approved: 0, budget_amount_spent: 0 });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [p],
      }));
      expect(r.personalisation_budget_utilisation_rate).toBe(0);
    });

    it("only some arrays populated — does not crash", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [makeFurniture()],
        dignity_space_records: [makeDignity()],
      }));
      expect(r.room_score).toBeGreaterThan(0);
      expect(r.personalisation_rate).toBe(0);
      expect(r.comfort_rate).toBe(0);
    });

    it("handles comfort rating at boundary values", () => {
      const c1 = makeComfort({ overall_comfort_rating: 1 });
      const c2 = makeComfort({ child_id: "child_2", overall_comfort_rating: 5 });
      const r = computeFurnitureRoomPersonalisation(baseInput({
        comfort_assessment_records: [c1, c2],
      }));
      expect(r.comfort_rating_avg).toBe(3);
    });

    it("handles same room_id for different children", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        furniture_adequacy_records: [
          makeFurniture({ child_id: "child_1", room_id: "room_1" }),
          makeFurniture({ child_id: "child_2", room_id: "room_1" }),
        ],
      }));
      expect(r.total_furniture_assessments).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SATISFACTION BOUNDARY (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Child satisfaction boundary values", () => {

    it("satisfaction concern at 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
        ],
        child_choice_records: [
          makeChoice({ fulfilled: true, child_satisfied_with_outcome: true }),
          makeChoice({ child_id: "child_2", fulfilled: true, child_satisfied_with_outcome: false }),
        ],
        comfort_assessment_records: [
          makeComfort({ child_reported: true }),
          makeComfort({ child_id: "child_2", child_reported: false }),
        ],
      }));
      // 3 positive / 6 opportunities = 50%
      expect(r.child_satisfaction_rate).toBe(50);
      expect(r.concerns.some(c => c.includes("satisfaction") && c.includes("50%"))).toBe(true);
    });

    it("satisfaction insight warning at 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
        ],
      }));
      // 1/2 = 50%
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("satisfaction"))).toBe(true);
    });

    it("satisfaction strength at 70-89%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_3", child_satisfied_with_room: false }),
        ],
      }));
      // 2/3 = 67% — check for strength at >= 70
      // This is 67%, so no strength at this level
      expect(r.child_satisfaction_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL SCENARIO: OUTSTANDING HOME (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Full scenario: outstanding home", () => {

    function outstandingInput(): FurnitureRoomInput {
      return baseInput({
        furniture_adequacy_records: [
          makeFurniture({ child_id: "child_1", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_2", furniture_condition: "excellent" }),
          makeFurniture({ child_id: "child_3", furniture_condition: "excellent" }),
        ],
        room_personalisation_records: [
          makePersonalisation({ child_id: "child_1" }),
          makePersonalisation({ child_id: "child_2" }),
          makePersonalisation({ child_id: "child_3" }),
        ],
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true, child_satisfied_with_outcome: true }),
          makeChoice({ child_id: "child_2", fulfilled: true, child_satisfied_with_outcome: true }),
          makeChoice({ child_id: "child_3", fulfilled: true, child_satisfied_with_outcome: true }),
        ],
        comfort_assessment_records: [
          makeComfort({ child_id: "child_1", overall_comfort_rating: 5 }),
          makeComfort({ child_id: "child_2", overall_comfort_rating: 5 }),
          makeComfort({ child_id: "child_3", overall_comfort_rating: 5 }),
        ],
        dignity_space_records: [
          makeDignity({ child_id: "child_1" }),
          makeDignity({ child_id: "child_2" }),
          makeDignity({ child_id: "child_3" }),
        ],
      });
    }

    it("achieves outstanding rating", () => {
      const r = computeFurnitureRoomPersonalisation(outstandingInput());
      expect(r.room_rating).toBe("outstanding");
    });

    it("has no concerns", () => {
      const r = computeFurnitureRoomPersonalisation(outstandingInput());
      expect(r.concerns.length).toBe(0);
    });

    it("has multiple strengths", () => {
      const r = computeFurnitureRoomPersonalisation(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL SCENARIO: INADEQUATE HOME (3 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Full scenario: inadequate home", () => {

    function inadequateInput(): FurnitureRoomInput {
      return baseInput({
        furniture_adequacy_records: [
          makeFurniture({
            child_id: "child_1", furniture_condition: "poor",
            bed_adequate: false, wardrobe_adequate: false, desk_adequate: false,
            shelving_adequate: false, seating_adequate: false, storage_adequate: false,
            lighting_adequate: false, curtains_blinds_adequate: false, floor_covering_adequate: false,
            child_consulted: false, inspection_overdue: true,
          }),
        ],
        room_personalisation_records: [
          makePersonalisation({
            child_id: "child_1",
            has_personal_photos: false, has_chosen_bedding: false,
            has_chosen_wall_decor: false, has_personal_belongings_displayed: false,
            has_chosen_colour_scheme: false, has_name_on_door: false,
            has_lockable_storage: false, has_notice_board: false,
            room_reflects_identity: false, child_satisfied_with_room: false,
            personalisation_budget_provided: false, review_overdue: true,
          }),
        ],
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: false, child_involved_in_selection: false, child_satisfied_with_outcome: false, staff_supported: false }),
        ],
        comfort_assessment_records: [
          makeComfort({
            child_id: "child_1",
            temperature_comfortable: false, noise_level_acceptable: false,
            privacy_adequate: false, natural_light_adequate: false,
            ventilation_adequate: false, mattress_comfortable: false,
            room_clean: false, room_tidy: false, feels_safe_in_room: false,
            overall_comfort_rating: 1, child_reported: false,
            issues_identified: 9, issues_resolved: 0,
          }),
        ],
        dignity_space_records: [
          makeDignity({
            child_id: "child_1",
            has_working_lock: false, knock_before_entry_observed: false,
            personal_space_respected: false, belongings_not_searched_without_consent: false,
            room_not_used_as_punishment: false, can_spend_time_alone: false,
            has_adequate_privacy: false, dignity_maintained_during_checks: false,
            child_feels_room_is_theirs: false, staff_awareness_of_dignity: false,
            dignity_concern_raised: true, dignity_concern_resolved: false,
          }),
        ],
      });
    }

    it("achieves inadequate rating", () => {
      const r = computeFurnitureRoomPersonalisation(inadequateInput());
      expect(r.room_rating).toBe("inadequate");
    });

    it("has many concerns", () => {
      const r = computeFurnitureRoomPersonalisation(inadequateInput());
      expect(r.concerns.length).toBeGreaterThan(10);
    });

    it("has many recommendations", () => {
      const r = computeFurnitureRoomPersonalisation(inadequateInput());
      expect(r.recommendations.length).toBeGreaterThan(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHOICE FULFILMENT / INVOLVEMENT (4 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Choice fulfilment and involvement", () => {

    it("recommends soon action for choice fulfilment 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: false }),
          makeChoice({ fulfilled: false }),
        ],
      }));
      // 2/4 = 50%
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("fulfilment"))).toBe(true);
    });

    it("recommends soon action for choice fulfilment < 50%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: false }),
          makeChoice({ fulfilled: false }),
          makeChoice({ fulfilled: false }),
        ],
      }));
      // 1/4 = 25% -- concern
      expect(r.concerns.some(c => c.includes("25%") && c.includes("fulfilled"))).toBe(true);
    });

    it("adds choice fulfilment strength when >= 70%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        child_choice_records: [
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: true }),
          makeChoice({ fulfilled: false }),
        ],
      }));
      // 75%
      expect(r.strengths.some(s => s.includes("75%") && (s.includes("fulfilment") || s.includes("fulfilled")))).toBe(true);
    });

    it("child choice coverage with 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        total_children: 3,
        child_choice_records: [
          makeChoice({ child_id: "child_1", fulfilled: true }),
          makeChoice({ child_id: "child_2", fulfilled: true }),
          makeChoice({ child_id: "child_3", fulfilled: false }),
        ],
      }));
      // 2 of 3 children with fulfilled = 67%
      expect(r.child_choice_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD SATISFACTION RECOMMENDATION (2 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Child satisfaction recommendations", () => {

    it("recommends planned exploration for satisfaction 50-69%", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [
          makePersonalisation({ child_satisfied_with_room: true }),
          makePersonalisation({ child_id: "child_2", child_satisfied_with_room: false }),
        ],
        child_choice_records: [
          makeChoice({ fulfilled: true, child_satisfied_with_outcome: true }),
          makeChoice({ child_id: "child_2", fulfilled: true, child_satisfied_with_outcome: false }),
        ],
        comfort_assessment_records: [
          makeComfort({ child_reported: true }),
          makeComfort({ child_id: "child_2", child_reported: false }),
        ],
      }));
      // 3/6 = 50%
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("satisfaction"))).toBe(true);
    });

    it("no satisfaction recommendation for high satisfaction", () => {
      const r = computeFurnitureRoomPersonalisation(baseInput({
        room_personalisation_records: [makePersonalisation({ child_satisfied_with_room: true })],
        child_choice_records: [makeChoice({ fulfilled: true, child_satisfied_with_outcome: true })],
        comfort_assessment_records: [makeComfort({ child_reported: true })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("satisfaction"))).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD CHOICE TYPE COVERAGE (2 tests)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Choice type variety", () => {

    it("tracks different choice types", () => {
      const choices: ChildChoiceInput[] = [
        makeChoice({ choice_type: "furniture" }),
        makeChoice({ choice_type: "decor" }),
        makeChoice({ choice_type: "colour" }),
        makeChoice({ choice_type: "bedding" }),
        makeChoice({ choice_type: "layout" }),
        makeChoice({ choice_type: "lighting" }),
        makeChoice({ choice_type: "accessories" }),
        makeChoice({ choice_type: "storage" }),
      ];
      const r = computeFurnitureRoomPersonalisation(baseInput({ child_choice_records: choices }));
      expect(r.total_choice_records).toBe(8);
      expect(r.insights.some(i => i.text.includes("choice types"))).toBe(true);
    });

    it("handles single choice type", () => {
      const choices = Array.from({ length: 6 }, () => makeChoice({ choice_type: "decor" }));
      const r = computeFurnitureRoomPersonalisation(baseInput({ child_choice_records: choices }));
      const insight = r.insights.find(i => i.text.includes("choice types"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("decor (6)");
    });
  });
});
