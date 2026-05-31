import { describe, it, expect } from "vitest";
import {
  computeHomeworkEnvironmentStudySpace,
  type HomeworkEnvironmentInput,
  type StudySpaceRecordInput,
  type NoiseEnvironmentRecordInput,
  type EquipmentRecordInput,
  type LightingRecordInput,
  type ChildSatisfactionRecordInput,
} from "../home-homework-environment-study-space-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────

function makeStudySpace(overrides: Partial<StudySpaceRecordInput> = {}): StudySpaceRecordInput {
  return {
    id: "ss_1",
    child_id: "c1",
    assessment_date: "2026-05-01",
    dedicated_space_available: true,
    space_type: "bedroom_desk",
    space_adequate_size: true,
    space_clean_tidy: true,
    space_free_from_distractions: true,
    private_when_needed: true,
    personalised_for_child: true,
    temperature_comfortable: true,
    ventilation_adequate: true,
    accessibility_suitable: true,
    storage_for_materials: true,
    assessed_by: "Staff A",
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

function makeNoise(overrides: Partial<NoiseEnvironmentRecordInput> = {}): NoiseEnvironmentRecordInput {
  return {
    id: "ne_1",
    child_id: "c1",
    assessment_date: "2026-05-01",
    noise_level_acceptable: true,
    noise_source: "none",
    noise_mitigation_in_place: false,
    mitigation_type: null,
    mitigation_effective: false,
    time_of_assessment: "evening",
    child_reported_disturbance: false,
    impact_on_concentration: "none",
    staff_action_taken: false,
    action_description: null,
    follow_up_needed: false,
    follow_up_completed: false,
    assessed_by: "Staff A",
    created_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

function makeEquipment(overrides: Partial<EquipmentRecordInput> = {}): EquipmentRecordInput {
  return {
    id: "eq_1",
    child_id: "c1",
    assessment_date: "2026-05-01",
    desk_available: true,
    chair_suitable: true,
    computer_laptop_available: true,
    internet_access: true,
    printer_access: true,
    stationery_available: true,
    textbooks_available: true,
    calculator_available: true,
    art_supplies_available: true,
    specialist_equipment_needed: false,
    specialist_equipment_provided: false,
    equipment_condition: "good",
    equipment_age_appropriate: true,
    replacement_needed: false,
    replacement_actioned: false,
    assessed_by: "Staff A",
    notes: null,
    created_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

function makeLighting(overrides: Partial<LightingRecordInput> = {}): LightingRecordInput {
  return {
    id: "lt_1",
    child_id: "c1",
    assessment_date: "2026-05-01",
    natural_light_adequate: true,
    artificial_light_adequate: true,
    desk_lamp_available: true,
    light_adjustable: true,
    glare_free: true,
    light_level_measured: true,
    light_level_lux: 500,
    meets_recommended_standard: true,
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    assessed_by: "Staff A",
    notes: null,
    created_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

function makeSatisfaction(overrides: Partial<ChildSatisfactionRecordInput> = {}): ChildSatisfactionRecordInput {
  return {
    id: "cs_1",
    child_id: "c1",
    survey_date: "2026-05-01",
    overall_satisfaction: 5,
    space_satisfaction: 5,
    noise_satisfaction: 5,
    equipment_satisfaction: 5,
    lighting_satisfaction: 5,
    feels_able_to_concentrate: true,
    feels_supported_in_study: true,
    would_change_anything: false,
    change_suggestions: null,
    prefers_different_location: false,
    preferred_location: null,
    study_hours_per_week: 10,
    homework_completion_rate_self_reported: 90,
    child_comments: null,
    collected_by: "Staff A",
    created_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeworkEnvironmentInput> = {}): HomeworkEnvironmentInput {
  return {
    today: "2026-05-31",
    total_children: 4,
    study_space_records: [
      makeStudySpace({ id: "ss_1", child_id: "c1" }),
      makeStudySpace({ id: "ss_2", child_id: "c2" }),
      makeStudySpace({ id: "ss_3", child_id: "c3" }),
      makeStudySpace({ id: "ss_4", child_id: "c4" }),
    ],
    noise_environment_records: [
      makeNoise({ id: "ne_1", child_id: "c1" }),
      makeNoise({ id: "ne_2", child_id: "c2" }),
      makeNoise({ id: "ne_3", child_id: "c3" }),
      makeNoise({ id: "ne_4", child_id: "c4" }),
    ],
    equipment_records: [
      makeEquipment({ id: "eq_1", child_id: "c1" }),
      makeEquipment({ id: "eq_2", child_id: "c2" }),
      makeEquipment({ id: "eq_3", child_id: "c3" }),
      makeEquipment({ id: "eq_4", child_id: "c4" }),
    ],
    lighting_records: [
      makeLighting({ id: "lt_1", child_id: "c1" }),
      makeLighting({ id: "lt_2", child_id: "c2" }),
      makeLighting({ id: "lt_3", child_id: "c3" }),
      makeLighting({ id: "lt_4", child_id: "c4" }),
    ],
    child_satisfaction_records: [
      makeSatisfaction({ id: "cs_1", child_id: "c1" }),
      makeSatisfaction({ id: "cs_2", child_id: "c2" }),
      makeSatisfaction({ id: "cs_3", child_id: "c3" }),
      makeSatisfaction({ id: "cs_4", child_id: "c4" }),
    ],
    ...overrides,
  };
}

// ── Helper to build many records with a specific trait ─────────────────

function manyStudySpaces(count: number, overrides: Partial<StudySpaceRecordInput> = {}): StudySpaceRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeStudySpace({ id: `ss_${i}`, child_id: `c${i}`, ...overrides }),
  );
}

function manyNoise(count: number, overrides: Partial<NoiseEnvironmentRecordInput> = {}): NoiseEnvironmentRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeNoise({ id: `ne_${i}`, child_id: `c${i}`, ...overrides }),
  );
}

function manyEquipment(count: number, overrides: Partial<EquipmentRecordInput> = {}): EquipmentRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeEquipment({ id: `eq_${i}`, child_id: `c${i}`, ...overrides }),
  );
}

function manyLighting(count: number, overrides: Partial<LightingRecordInput> = {}): LightingRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeLighting({ id: `lt_${i}`, child_id: `c${i}`, ...overrides }),
  );
}

function manySatisfaction(count: number, overrides: Partial<ChildSatisfactionRecordInput> = {}): ChildSatisfactionRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    makeSatisfaction({ id: `cs_${i}`, child_id: `c${i}`, ...overrides }),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHomeworkEnvironmentStudySpace", () => {
  // ── 1. Empty / Edge Cases ───────────────────────────────────────────────

  describe("empty and edge cases", () => {
    it("1 — returns insufficient_data when all arrays empty and 0 children", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 0,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.study_rating).toBe("insufficient_data");
      expect(r.study_score).toBe(0);
    });

    it("2 — returns inadequate with score 15 when all arrays empty but children > 0", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 3,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.study_rating).toBe("inadequate");
      expect(r.study_score).toBe(15);
    });

    it("3 — insufficient_data headline mentions no children on placement", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 0,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.headline).toContain("No children on placement");
    });

    it("4 — all-empty+children produces concerns array with one item", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No study space assessments");
    });

    it("5 — all-empty+children produces 2 recommendations", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("6 — all-empty+children produces 1 critical insight", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("7 — all-empty+children has zero rates", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.study_space_rate).toBe(0);
      expect(r.noise_environment_rate).toBe(0);
      expect(r.equipment_rate).toBe(0);
      expect(r.lighting_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
      expect(r.utilisation_rate).toBe(0);
    });

    it("8 — all-empty+children headline mentions urgent attention", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 5,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.headline).toContain("urgent attention");
    });

    it("9 — all-empty totals are all 0", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 0,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.total_space_assessments).toBe(0);
      expect(r.total_noise_assessments).toBe(0);
      expect(r.total_equipment_assessments).toBe(0);
      expect(r.total_lighting_assessments).toBe(0);
      expect(r.total_satisfaction_surveys).toBe(0);
    });

    it("10 — all-empty strengths/concerns/recommendations/insights are empty for insufficient_data", () => {
      const r = computeHomeworkEnvironmentStudySpace({
        today: "2026-05-31",
        total_children: 0,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      });
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ── 2. Outstanding Scenario ─────────────────────────────────────────────

  describe("outstanding scenario — all perfect", () => {
    it("11 — perfect data yields outstanding rating", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_rating).toBe("outstanding");
    });

    it("12 — perfect data yields score >= 80", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_score).toBeGreaterThanOrEqual(80);
    });

    it("13 — perfect data yields 100% study_space_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_space_rate).toBe(100);
    });

    it("14 — perfect data yields 100% noise_environment_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.noise_environment_rate).toBe(100);
    });

    it("15 — perfect data yields 100% equipment_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.equipment_rate).toBe(100);
    });

    it("16 — perfect data yields 100% lighting_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.lighting_rate).toBe(100);
    });

    it("17 — perfect data yields 100% child_satisfaction_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("18 — perfect data yields 100% utilisation_rate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.utilisation_rate).toBe(100);
    });

    it("19 — outstanding headline mentions outstanding", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("20 — outstanding has no concerns", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("21 — outstanding has strengths", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("22 — outstanding has no recommendations", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("23 — outstanding has positive insights", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      const positive = r.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThan(0);
    });

    it("24 — outstanding has insight about outstanding provision", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      const outstanding = r.insights.find((i) => i.text.includes("outstanding homework environment"));
      expect(outstanding).toBeDefined();
      expect(outstanding!.severity).toBe("positive");
    });

    it("25 — correct totals for 4 records each", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.total_space_assessments).toBe(4);
      expect(r.total_noise_assessments).toBe(4);
      expect(r.total_equipment_assessments).toBe(4);
      expect(r.total_lighting_assessments).toBe(4);
      expect(r.total_satisfaction_surveys).toBe(4);
    });
  });

  // ── 3. Score Bonuses ────────────────────────────────────────────────────

  describe("score bonuses", () => {
    // Base score is 52. All-perfect yields bonuses: +4+4+4+3+4+3+3+3 = 28 => 80
    it("26 — base score 52 + all bonuses = 80", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_score).toBe(80);
    });

    it("27 — studySpaceRate >= 90 adds +4", () => {
      // All perfect except noise/equip/light/sat are empty; only space records with 4 unique children
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (space>=90) + 3 (utilisation>=80 since 4/4=100%) = 59
      // But also concerns for missing noise/equip/light/sat which are not penalties, just concerns
      expect(r.study_score).toBe(59);
    });

    it("28 — studySpaceRate 70-89 adds +2", () => {
      // 8 of 10 checks pass => 80%
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: true,
        space_adequate_size: true,
        space_clean_tidy: true,
        space_free_from_distractions: true,
        private_when_needed: true,
        personalised_for_child: true,
        temperature_comfortable: true,
        ventilation_adequate: true,
        accessibility_suitable: false,
        storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 2 (space 70-89) + 3 (utilisation=100%) = 57
      expect(r.study_score).toBe(57);
    });

    it("29 — noiseEnvironmentRate >= 90 adds +4", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (noise>=90) = 56
      expect(r.study_score).toBe(56);
    });

    it("30 — equipmentRate >= 90 adds +4", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (equip>=90) + 3 (goodCondition>=90, default "good") = 59
      expect(r.study_score).toBe(59);
    });

    it("31 — lightingRate >= 90 adds +3", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 3 (lighting>=90) = 55
      expect(r.study_score).toBe(55);
    });

    it("32 — childSatisfactionRate >= 90 adds +4", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      // base 52 + 4 (satisfaction>=90) + 3 (concentration>=90) = 59
      expect(r.study_score).toBe(59);
    });

    it("33 — utilisationRate >= 80 adds +3", () => {
      // 4 unique children, 4 total => 100%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // includes +4 space + +3 utilisation = 59
      expect(r.study_score).toBe(59);
    });

    it("34 — utilisationRate 50-79 adds +1", () => {
      // 3 unique children out of 5 total = 60%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 5,
        study_space_records: [
          makeStudySpace({ id: "ss_1", child_id: "c1" }),
          makeStudySpace({ id: "ss_2", child_id: "c2" }),
          makeStudySpace({ id: "ss_3", child_id: "c3" }),
        ],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (space>=90) + 1 (util 50-79) = 57
      expect(r.study_score).toBe(57);
    });

    it("35 — concentrationRate >= 90 adds +3", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      // base 52 + 4 (sat>=90) + 3 (conc>=90) = 59
      expect(r.study_score).toBe(59);
    });

    it("36 — goodConditionRate >= 90 adds +3", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (equip>=90) + 3 (goodCondition>=90) = 59
      expect(r.study_score).toBe(59);
    });

    it("37 — lightingRate 70-89 adds +1", () => {
      // 4 of 5 lighting checks pass => 80%
      const lights = manyLighting(1, {
        natural_light_adequate: true,
        artificial_light_adequate: true,
        desk_lamp_available: true,
        glare_free: true,
        meets_recommended_standard: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      // base 52 + 1 (lighting 70-89) = 53
      expect(r.study_score).toBe(53);
    });

    it("38 — noiseEnvironmentRate 70-89 adds +2", () => {
      // 8 noise records, 6 acceptable => 75%
      const noises = [
        ...manyNoise(6, { noise_level_acceptable: true }),
        ...manyNoise(2, { noise_level_acceptable: false }),
      ].map((n, i) => ({ ...n, id: `ne_${i}`, child_id: `c${i % 4}` }));
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 2 (noise 70-89) = 54
      expect(r.study_score).toBe(54);
    });
  });

  // ── 4. Score Penalties ──────────────────────────────────────────────────

  describe("score penalties", () => {
    it("39 — studySpaceRate < 50 penalises -5", () => {
      // 3 of 10 checks pass => 30%
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: true,
        space_adequate_size: true,
        space_clean_tidy: true,
        space_free_from_distractions: false,
        private_when_needed: false,
        personalised_for_child: false,
        temperature_comfortable: false,
        ventilation_adequate: false,
        accessibility_suitable: false,
        storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 - 5 (space<50) + 3 (util>=80, 1/1=100%) = 50
      expect(r.study_score).toBe(50);
    });

    it("40 — noiseEnvironmentRate < 50 penalises -5", () => {
      // 1 acceptable out of 4 => 25%
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true }),
        makeNoise({ id: "ne_1", noise_level_acceptable: false }),
        makeNoise({ id: "ne_2", noise_level_acceptable: false }),
        makeNoise({ id: "ne_3", noise_level_acceptable: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 - 5 (noise<50) = 47
      expect(r.study_score).toBe(47);
    });

    it("41 — equipmentRate < 50 penalises -5", () => {
      // 2 of 7 checks pass => ~29%
      const equips = manyEquipment(1, {
        desk_available: true,
        chair_suitable: true,
        computer_laptop_available: false,
        internet_access: false,
        stationery_available: false,
        textbooks_available: false,
        equipment_age_appropriate: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 - 5 (equip<50) + 3 (goodCondition>=90, default "good") = 50
      expect(r.study_score).toBe(50);
    });

    it("42 — concentrationImpactRate > 50 penalises -3", () => {
      // 3 of 4 with moderate/severe impact => 75%
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true, impact_on_concentration: "moderate" }),
        makeNoise({ id: "ne_1", noise_level_acceptable: true, impact_on_concentration: "severe" }),
        makeNoise({ id: "ne_2", noise_level_acceptable: true, impact_on_concentration: "moderate" }),
        makeNoise({ id: "ne_3", noise_level_acceptable: true, impact_on_concentration: "none" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (noise>=90) - 3 (concImpact>50) = 53
      expect(r.study_score).toBe(53);
    });

    it("43 — multiple penalties can stack", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false,
        space_adequate_size: false,
        space_clean_tidy: false,
        space_free_from_distractions: false,
        private_when_needed: false,
        personalised_for_child: false,
        temperature_comfortable: false,
        ventilation_adequate: false,
        accessibility_suitable: false,
        storage_for_materials: false,
      });
      const noises = manyNoise(1, { noise_level_acceptable: false, impact_on_concentration: "severe" });
      const equips = manyEquipment(1, {
        desk_available: false,
        chair_suitable: false,
        computer_laptop_available: false,
        internet_access: false,
        stationery_available: false,
        textbooks_available: false,
        equipment_age_appropriate: false,
        equipment_condition: "poor",
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: noises,
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 - 5 (space<50) - 5 (noise<50) - 5 (equip<50) - 3 (concImpact>50) + 3(util>=80) = 37
      expect(r.study_score).toBe(37);
    });

    it("44 — score is clamped to minimum 0", () => {
      // Even with many penalties, score should not go below 0
      // But the engine starts at 52 with max -18 penalties, so minimum would be 34.
      // We can verify clamp doesn't go negative with extreme data
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: manyStudySpaces(1, {
          dedicated_space_available: false, space_adequate_size: false,
          space_clean_tidy: false, space_free_from_distractions: false,
          private_when_needed: false, personalised_for_child: false,
          temperature_comfortable: false, ventilation_adequate: false,
          accessibility_suitable: false, storage_for_materials: false,
        }),
        noise_environment_records: manyNoise(1, { noise_level_acceptable: false, impact_on_concentration: "severe" }),
        equipment_records: manyEquipment(1, {
          desk_available: false, chair_suitable: false,
          computer_laptop_available: false, internet_access: false,
          stationery_available: false, textbooks_available: false,
          equipment_age_appropriate: false, equipment_condition: "poor",
        }),
        lighting_records: manyLighting(1, {
          natural_light_adequate: false, artificial_light_adequate: false,
          desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
        }),
        child_satisfaction_records: manySatisfaction(1, {
          overall_satisfaction: 1, feels_able_to_concentrate: false,
          feels_supported_in_study: false, homework_completion_rate_self_reported: 10,
        }),
      }));
      expect(r.study_score).toBeGreaterThanOrEqual(0);
    });

    it("45 — score is clamped to maximum 100", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_score).toBeLessThanOrEqual(100);
    });
  });

  // ── 5. Rating Thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("46 — score >= 80 is outstanding", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.study_score).toBeGreaterThanOrEqual(80);
      expect(r.study_rating).toBe("outstanding");
    });

    it("47 — score 65-79 is good", () => {
      // Remove some satisfaction to lower score
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: [],
        lighting_records: [],
      }));
      // base 52 + 4 (space) + 4 (noise) + 4 (equip) + 3 (goodCond) + 3 (util) = 70
      expect(r.study_score).toBeGreaterThanOrEqual(65);
      expect(r.study_score).toBeLessThan(80);
      expect(r.study_rating).toBe("good");
    });

    it("48 — score 45-64 is adequate", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: manySatisfaction(4, { overall_satisfaction: 5 }),
      }));
      // base 52 + 4(sat>=90) + 3(conc>=90) = 59
      expect(r.study_score).toBeGreaterThanOrEqual(45);
      expect(r.study_score).toBeLessThan(65);
      expect(r.study_rating).toBe("adequate");
    });

    it("49 — score < 45 is inadequate", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const noises = manyNoise(1, { noise_level_acceptable: false, impact_on_concentration: "severe" });
      const equips = manyEquipment(1, {
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false, equipment_condition: "poor",
      });
      const lights = manyLighting(1, {
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      });
      const sats = manySatisfaction(1, {
        overall_satisfaction: 1, feels_able_to_concentrate: false,
        feels_supported_in_study: false, homework_completion_rate_self_reported: 10,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: noises,
        equipment_records: equips,
        lighting_records: lights,
        child_satisfaction_records: sats,
      }));
      expect(r.study_score).toBeLessThan(45);
      expect(r.study_rating).toBe("inadequate");
    });
  });

  // ── 6. Study Space Rate ─────────────────────────────────────────────────

  describe("study space rate calculation", () => {
    it("50 — 10/10 checks pass yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.study_space_rate).toBe(100);
    });

    it("51 — 5/10 checks pass yields 50%", () => {
      const spaces = [makeStudySpace({
        dedicated_space_available: true,
        space_adequate_size: true,
        space_clean_tidy: true,
        space_free_from_distractions: true,
        private_when_needed: true,
        personalised_for_child: false,
        temperature_comfortable: false,
        ventilation_adequate: false,
        accessibility_suitable: false,
        storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.study_space_rate).toBe(50);
    });

    it("52 — 0/10 checks pass yields 0%", () => {
      const spaces = [makeStudySpace({
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.study_space_rate).toBe(0);
    });

    it("53 — multiple records averaged correctly", () => {
      // Record 1: 10/10 pass, Record 2: 0/10 pass => 10/20 = 50%
      const spaces = [
        makeStudySpace({ id: "ss_a" }),
        makeStudySpace({
          id: "ss_b",
          dedicated_space_available: false, space_adequate_size: false,
          space_clean_tidy: false, space_free_from_distractions: false,
          private_when_needed: false, personalised_for_child: false,
          temperature_comfortable: false, ventilation_adequate: false,
          accessibility_suitable: false, storage_for_materials: false,
        }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.study_space_rate).toBe(50);
    });

    it("54 — no study space records yields 0%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // empty+children returns early, but let's verify with at least one other record type
      expect(r.study_space_rate).toBe(0);
    });
  });

  // ── 7. Noise Environment Rate ───────────────────────────────────────────

  describe("noise environment rate calculation", () => {
    it("55 — all acceptable yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.noise_environment_rate).toBe(100);
    });

    it("56 — half acceptable yields 50%", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true }),
        makeNoise({ id: "ne_1", noise_level_acceptable: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.noise_environment_rate).toBe(50);
    });

    it("57 — none acceptable yields 0%", () => {
      const noises = manyNoise(4, { noise_level_acceptable: false });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.noise_environment_rate).toBe(0);
    });
  });

  // ── 8. Equipment Rate ───────────────────────────────────────────────────

  describe("equipment rate calculation", () => {
    it("58 — all 7 checks pass yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.equipment_rate).toBe(100);
    });

    it("59 — 4 of 7 checks pass yields 57%", () => {
      const equips = [makeEquipment({
        desk_available: true,
        chair_suitable: true,
        computer_laptop_available: true,
        internet_access: true,
        stationery_available: false,
        textbooks_available: false,
        equipment_age_appropriate: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.equipment_rate).toBe(57);
    });

    it("60 — 0 of 7 checks pass yields 0%", () => {
      const equips = [makeEquipment({
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.equipment_rate).toBe(0);
    });
  });

  // ── 9. Lighting Rate ────────────────────────────────────────────────────

  describe("lighting rate calculation", () => {
    it("61 — all 5 checks pass yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.lighting_rate).toBe(100);
    });

    it("62 — 3 of 5 checks pass yields 60%", () => {
      const lights = [makeLighting({
        natural_light_adequate: true,
        artificial_light_adequate: true,
        desk_lamp_available: true,
        glare_free: false,
        meets_recommended_standard: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.lighting_rate).toBe(60);
    });

    it("63 — 0 of 5 checks pass yields 0%", () => {
      const lights = [makeLighting({
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.lighting_rate).toBe(0);
    });
  });

  // ── 10. Child Satisfaction Rate ─────────────────────────────────────────

  describe("child satisfaction rate", () => {
    it("64 — all score 4 or 5 yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("65 — score of 3 does not count as satisfied", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", overall_satisfaction: 5 }),
        makeSatisfaction({ id: "cs_1", overall_satisfaction: 3 }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.child_satisfaction_rate).toBe(50);
    });

    it("66 — all score 1 yields 0%", () => {
      const sats = manySatisfaction(4, { overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("67 — score of 4 counts as satisfied", () => {
      const sats = manySatisfaction(4, { overall_satisfaction: 4 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.child_satisfaction_rate).toBe(100);
    });
  });

  // ── 11. Utilisation Rate ────────────────────────────────────────────────

  describe("utilisation rate", () => {
    it("68 — all children have study space yields 100%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.utilisation_rate).toBe(100);
    });

    it("69 — half of children have study space yields 50%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [
          makeStudySpace({ id: "ss_1", child_id: "c1" }),
          makeStudySpace({ id: "ss_2", child_id: "c2" }),
        ],
      }));
      expect(r.utilisation_rate).toBe(50);
    });

    it("70 — no study space records with children yields 0%", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [makeNoise()],
      }));
      expect(r.utilisation_rate).toBe(0);
    });

    it("71 — duplicate child_id counts as 1 unique child", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [
          makeStudySpace({ id: "ss_1", child_id: "c1" }),
          makeStudySpace({ id: "ss_2", child_id: "c1" }),
          makeStudySpace({ id: "ss_3", child_id: "c1" }),
        ],
      }));
      expect(r.utilisation_rate).toBe(50);
    });

    it("72 — total_children 0 yields 0% utilisation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 0,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // actually returns insufficient_data early
      expect(r.utilisation_rate).toBe(0);
    });
  });

  // ── 12. Strengths ───────────────────────────────────────────────────────

  describe("strengths", () => {
    it("73 — studySpaceRate >= 90 adds study space strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("100% study space quality"))).toBe(true);
    });

    it("74 — studySpaceRate 70-89 adds different study space strength", () => {
      // 8/10 pass => 80%
      const spaces = [makeStudySpace({
        accessibility_suitable: false,
        storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.strengths.some((s) => s.includes("generally suitable environments"))).toBe(true);
    });

    it("75 — dedicatedSpaceRate >= 90 adds dedicated space strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("dedicated study space"))).toBe(true);
    });

    it("76 — noiseEnvironmentRate >= 90 adds noise strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("noise environment compliance"))).toBe(true);
    });

    it("77 — equipmentRate >= 90 adds equipment strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("equipment availability"))).toBe(true);
    });

    it("78 — lightingRate >= 90 adds lighting strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("lighting adequacy"))).toBe(true);
    });

    it("79 — childSatisfactionRate >= 90 adds satisfaction strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("child satisfaction with study conditions"))).toBe(true);
    });

    it("80 — concentrationRate >= 90 adds concentration strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("feel able to concentrate"))).toBe(true);
    });

    it("81 — studySupportRate >= 90 adds support strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("feel supported in their study"))).toBe(true);
    });

    it("82 — computerAvailabilityRate >= 90 adds computer strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("computer and laptop availability"))).toBe(true);
    });

    it("83 — internetAccessRate >= 90 adds internet strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("internet access"))).toBe(true);
    });

    it("84 — specialistProvisionRate >= 90 adds specialist strength", () => {
      const equips = manyEquipment(4, {
        specialist_equipment_needed: true,
        specialist_equipment_provided: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({ equipment_records: equips }));
      expect(r.strengths.some((s) => s.includes("specialist equipment provision"))).toBe(true);
    });

    it("85 — deskLampRate >= 90 adds desk lamp strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("desk lamp availability"))).toBe(true);
    });

    it("86 — spaceIssueResolutionRate >= 90 adds resolution strength", () => {
      const spaces = manyStudySpaces(4, {
        issues_identified: ["old desk"],
        issues_resolved: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({ study_space_records: spaces }));
      expect(r.strengths.some((s) => s.includes("study space issues resolved"))).toBe(true);
    });

    it("87 — noiseMitigationRate >= 90 adds mitigation strength", () => {
      const noises = manyNoise(4, {
        noise_level_acceptable: false,
        noise_mitigation_in_place: true,
        mitigation_effective: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.strengths.some((s) => s.includes("noise mitigation in place"))).toBe(true);
    });

    it("88 — avgHomeworkCompletion >= 85 adds homework strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("homework completion"))).toBe(true);
    });

    it("89 — avgHomeworkCompletion 70-84 adds lower homework strength", () => {
      const sats = manySatisfaction(4, { homework_completion_rate_self_reported: 75 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.strengths.some((s) => s.includes("homework completion") && s.includes("75%"))).toBe(true);
    });

    it("90 — goodConditionRate >= 90 adds condition strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("good or excellent condition"))).toBe(true);
    });

    it("91 — utilisationRate >= 80 adds utilisation strength", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.strengths.some((s) => s.includes("study space utilisation coverage"))).toBe(true);
    });

    it("92 — no strengths for rates below 70", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      const spaceStrengths = r.strengths.filter((s) => s.includes("study space quality"));
      expect(spaceStrengths).toHaveLength(0);
    });

    it("93 — noiseEnvironmentRate 70-89 adds moderate noise strength", () => {
      const noises = [
        ...manyNoise(3, { noise_level_acceptable: true }),
        makeNoise({ id: "ne_bad", noise_level_acceptable: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.strengths.some((s) => s.includes("generally provides quiet study conditions"))).toBe(true);
    });
  });

  // ── 13. Concerns ────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("94 — studySpaceRate < 50 adds critical study space concern", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: true, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("study space quality") && c.includes("not met"))).toBe(true);
    });

    it("95 — studySpaceRate 50-69 adds moderate study space concern", () => {
      // 6/10 = 60%
      const spaces = [makeStudySpace({
        dedicated_space_available: true,
        space_adequate_size: true,
        space_clean_tidy: true,
        space_free_from_distractions: true,
        private_when_needed: true,
        personalised_for_child: true,
        temperature_comfortable: false,
        ventilation_adequate: false,
        accessibility_suitable: false,
        storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("Study space quality at 60%"))).toBe(true);
    });

    it("96 — noiseEnvironmentRate < 50 adds noise concern", () => {
      const noises = manyNoise(4, { noise_level_acceptable: false });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("noise environment compliance"))).toBe(true);
    });

    it("97 — noiseEnvironmentRate 50-69 adds moderate noise concern", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true }),
        makeNoise({ id: "ne_1", noise_level_acceptable: true }),
        makeNoise({ id: "ne_2", noise_level_acceptable: true }),
        makeNoise({ id: "ne_3", noise_level_acceptable: false }),
        makeNoise({ id: "ne_4", noise_level_acceptable: false }),
        makeNoise({ id: "ne_5", noise_level_acceptable: false }),
      ]; // 50%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("Noise environment compliance at 50%"))).toBe(true);
    });

    it("98 — equipmentRate < 50 adds equipment concern", () => {
      const equips = manyEquipment(1, {
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("equipment availability"))).toBe(true);
    });

    it("99 — equipmentRate 50-69 adds moderate equipment concern", () => {
      // 4/7 = 57%
      const equips = [makeEquipment({
        desk_available: true, chair_suitable: true,
        computer_laptop_available: true, internet_access: true,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("Equipment availability at 57%"))).toBe(true);
    });

    it("100 — lightingRate < 50 adds lighting concern", () => {
      const lights = manyLighting(1, {
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("lighting adequacy"))).toBe(true);
    });

    it("101 — lightingRate 50-69 adds moderate lighting concern", () => {
      // 3/5 = 60%
      const lights = [makeLighting({
        natural_light_adequate: true, artificial_light_adequate: true,
        desk_lamp_available: true, glare_free: false, meets_recommended_standard: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("Lighting adequacy at 60%"))).toBe(true);
    });

    it("102 — childSatisfactionRate < 50 adds satisfaction concern", () => {
      const sats = manySatisfaction(4, { overall_satisfaction: 2 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("child satisfaction with study conditions"))).toBe(true);
    });

    it("103 — childSatisfactionRate 50-69 adds moderate satisfaction concern", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", overall_satisfaction: 5 }),
        makeSatisfaction({ id: "cs_1", overall_satisfaction: 1 }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.concerns.some((c) => c.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("104 — concentrationRate < 50 adds concentration concern", () => {
      const sats = manySatisfaction(4, { feels_able_to_concentrate: false, overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("feel able to concentrate"))).toBe(true);
    });

    it("105 — concentrationRate 50-69 adds moderate concentration concern", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", feels_able_to_concentrate: true }),
        makeSatisfaction({ id: "cs_1", feels_able_to_concentrate: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.concerns.some((c) => c.includes("Concentration ability at 50%"))).toBe(true);
    });

    it("106 — concentrationImpactRate > 50 adds noise impact concern", () => {
      const noises = manyNoise(4, { impact_on_concentration: "severe" });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("concentration impact"))).toBe(true);
    });

    it("107 — concentrationImpactRate 31-50 adds moderate noise impact concern", () => {
      // 2 of 5 with moderate impact => 40%
      const noises = [
        makeNoise({ id: "ne_0", impact_on_concentration: "moderate" }),
        makeNoise({ id: "ne_1", impact_on_concentration: "severe" }),
        makeNoise({ id: "ne_2", impact_on_concentration: "none" }),
        makeNoise({ id: "ne_3", impact_on_concentration: "none" }),
        makeNoise({ id: "ne_4", impact_on_concentration: "none" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 5,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("concentration impact"))).toBe(true);
    });

    it("108 — poorConditionRate > 30 adds poor condition concern", () => {
      // 2 of 4 poor => 50%
      const equips = [
        makeEquipment({ id: "eq_0", equipment_condition: "poor" }),
        makeEquipment({ id: "eq_1", equipment_condition: "poor" }),
        makeEquipment({ id: "eq_2", equipment_condition: "good" }),
        makeEquipment({ id: "eq_3", equipment_condition: "good" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("poor condition"))).toBe(true);
    });

    it("109 — avgHomeworkCompletion < 50 adds homework concern", () => {
      const sats = manySatisfaction(4, { homework_completion_rate_self_reported: 30 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("homework completion"))).toBe(true);
    });

    it("110 — avgHomeworkCompletion 50-69 adds moderate homework concern", () => {
      const sats = manySatisfaction(4, { homework_completion_rate_self_reported: 60 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("homework completion") && c.includes("60%"))).toBe(true);
    });

    it("111 — studySupportRate < 50 adds support concern", () => {
      const sats = manySatisfaction(4, { feels_supported_in_study: false, overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("feel supported in their study"))).toBe(true);
    });

    it("112 — studySupportRate 50-69 adds moderate support concern", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", feels_supported_in_study: true }),
        makeSatisfaction({ id: "cs_1", feels_supported_in_study: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.concerns.some((c) => c.includes("Study support perception at 50%"))).toBe(true);
    });

    it("113 — locationDissatisfactionRate > 50 adds location concern", () => {
      const sats = manySatisfaction(4, { prefers_different_location: true });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("prefer a different study location"))).toBe(true);
    });

    it("114 — no space assessments but other records exist adds concern", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [makeNoise()],
      }));
      expect(r.concerns.some((c) => c.includes("No study space assessments recorded"))).toBe(true);
    });

    it("115 — no equipment assessments but other records exist adds concern", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: [],
        noise_environment_records: [makeNoise()],
        study_space_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No equipment assessments recorded"))).toBe(true);
    });

    it("116 — no lighting assessments but other records exist adds concern", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        lighting_records: [],
        noise_environment_records: [makeNoise()],
        study_space_records: [],
        equipment_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No lighting assessments recorded"))).toBe(true);
    });

    it("117 — no noise assessments but other records exist adds concern", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: [],
        study_space_records: [makeStudySpace()],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No noise environment assessments recorded"))).toBe(true);
    });

    it("118 — no satisfaction surveys but other records exist adds concern", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: [],
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No child satisfaction surveys"))).toBe(true);
    });

    it("119 — dedicatedSpaceRate < 50 adds dedicated space concern", () => {
      const spaces = [
        makeStudySpace({ id: "ss_0", dedicated_space_available: false }),
        makeStudySpace({ id: "ss_1", dedicated_space_available: false }),
        makeStudySpace({ id: "ss_2", dedicated_space_available: false }),
        makeStudySpace({ id: "ss_3", dedicated_space_available: true }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("dedicated study space"))).toBe(true);
    });

    it("120 — dedicatedSpaceRate 50-69 adds moderate dedicated space concern", () => {
      // 3 of 5 = 60%
      const spaces = [
        makeStudySpace({ id: "ss_0", dedicated_space_available: true }),
        makeStudySpace({ id: "ss_1", dedicated_space_available: true }),
        makeStudySpace({ id: "ss_2", dedicated_space_available: true }),
        makeStudySpace({ id: "ss_3", dedicated_space_available: false }),
        makeStudySpace({ id: "ss_4", dedicated_space_available: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 5,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("Dedicated study space provision at 60%"))).toBe(true);
    });
  });

  // ── 14. Recommendations ─────────────────────────────────────────────────

  describe("recommendations", () => {
    it("121 — studySpaceRate < 50 triggers immediate study space recommendation", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("study space provision"))).toBe(true);
    });

    it("122 — noiseEnvironmentRate < 50 triggers immediate noise recommendation", () => {
      const noises = manyNoise(4, { noise_level_acceptable: false });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("noise management"))).toBe(true);
    });

    it("123 — equipmentRate < 50 triggers immediate equipment recommendation", () => {
      const equips = manyEquipment(1, {
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("study equipment"))).toBe(true);
    });

    it("124 — concentrationImpactRate > 50 triggers immediate review recommendation", () => {
      const noises = manyNoise(4, { impact_on_concentration: "severe" });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("noise impact"))).toBe(true);
    });

    it("125 — childSatisfactionRate < 50 triggers immediate consultation recommendation", () => {
      const sats = manySatisfaction(4, { overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Consult children"))).toBe(true);
    });

    it("126 — lightingRate < 50 triggers immediate lighting recommendation", () => {
      const lights = manyLighting(1, {
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("lighting"))).toBe(true);
    });

    it("127 — concentrationRate < 50 triggers immediate investigation recommendation", () => {
      const sats = manySatisfaction(4, { feels_able_to_concentrate: false, overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("concentrate"))).toBe(true);
    });

    it("128 — missing space assessments triggers immediate recommendation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [makeNoise()],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("study space assessments"))).toBe(true);
    });

    it("129 — missing equipment assessments triggers immediate recommendation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: [],
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("equipment audits"))).toBe(true);
    });

    it("130 — missing lighting assessments triggers immediate recommendation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        lighting_records: [],
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        equipment_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("lighting assessments"))).toBe(true);
    });

    it("131 — missing noise assessments triggers immediate recommendation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: [],
        study_space_records: [makeStudySpace()],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("noise environment assessments"))).toBe(true);
    });

    it("132 — missing satisfaction surveys triggers immediate recommendation", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: [],
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("children's views"))).toBe(true);
    });

    it("133 — studySupportRate < 50 triggers soon training recommendation", () => {
      const sats = manySatisfaction(4, { feels_supported_in_study: false, overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("homework assistance"))).toBe(true);
    });

    it("134 — noiseFollowUpRate < 50 triggers soon follow-up recommendation", () => {
      const noises = manyNoise(4, {
        noise_level_acceptable: true,
        follow_up_needed: true,
        follow_up_completed: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("follow-up"))).toBe(true);
    });

    it("135 — studySpaceRate 50-69 triggers soon improvement recommendation", () => {
      // 6/10 = 60%
      const spaces = [makeStudySpace({
        dedicated_space_available: true, space_adequate_size: true,
        space_clean_tidy: true, space_free_from_distractions: true,
        private_when_needed: true, personalised_for_child: true,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("study space quality to at least 70%"))).toBe(true);
    });

    it("136 — noiseEnvironmentRate 50-69 triggers soon improvement recommendation", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true }),
        makeNoise({ id: "ne_1", noise_level_acceptable: false }),
      ]; // 50%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("noise management"))).toBe(true);
    });

    it("137 — equipmentRate 50-69 triggers soon provision recommendation", () => {
      // 4/7 = 57%
      const equips = [makeEquipment({
        desk_available: true, chair_suitable: true,
        computer_laptop_available: true, internet_access: true,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("equipment provision"))).toBe(true);
    });

    it("138 — lightingRate 50-69 triggers planned improvement recommendation", () => {
      // 3/5 = 60%
      const lights = [makeLighting({
        natural_light_adequate: true, artificial_light_adequate: true,
        desk_lamp_available: true, glare_free: false, meets_recommended_standard: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("lighting standards"))).toBe(true);
    });

    it("139 — childSatisfactionRate 50-69 triggers planned feedback recommendation", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", overall_satisfaction: 5 }),
        makeSatisfaction({ id: "cs_1", overall_satisfaction: 1 }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("child feedback"))).toBe(true);
    });

    it("140 — utilisationRate < 50 triggers planned provision recommendation", () => {
      // 1 of 4 = 25%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 4,
        study_space_records: [makeStudySpace({ child_id: "c1" })],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("study space provision assessments"))).toBe(true);
    });

    it("141 — poorConditionRate > 30 triggers planned replacement recommendation", () => {
      const equips = [
        makeEquipment({ id: "eq_0", equipment_condition: "poor" }),
        makeEquipment({ id: "eq_1", equipment_condition: "poor" }),
        makeEquipment({ id: "eq_2", equipment_condition: "good" }),
        makeEquipment({ id: "eq_3", equipment_condition: "good" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Replace equipment"))).toBe(true);
    });

    it("142 — locationDissatisfactionRate > 50 triggers planned location recommendation", () => {
      const sats = manySatisfaction(4, { prefers_different_location: true });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("study location arrangements"))).toBe(true);
    });

    it("143 — replacementActionRate < 50 triggers soon replacement recommendation", () => {
      const equips = manyEquipment(4, {
        replacement_needed: true,
        replacement_actioned: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("equipment replacements"))).toBe(true);
    });

    it("144 — recommendations have sequential ranks", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const noises = manyNoise(1, { noise_level_acceptable: false });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("145 — recommendations reference regulatory_ref", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [makeNoise()],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });

    it("146 — perfect data produces no recommendations", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ── 15. Insights ────────────────────────────────────────────────────────

  describe("insights", () => {
    it("147 — studySpaceRate < 50 produces critical insight", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("study space quality"))).toBe(true);
    });

    it("148 — noiseEnvironmentRate < 50 produces critical insight", () => {
      const noises = manyNoise(4, { noise_level_acceptable: false });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("noise environment compliance"))).toBe(true);
    });

    it("149 — equipmentRate < 50 produces critical insight", () => {
      const equips = manyEquipment(1, {
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("equipment availability"))).toBe(true);
    });

    it("150 — concentrationImpactRate > 50 produces critical insight", () => {
      const noises = manyNoise(4, { impact_on_concentration: "severe" });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("concentration impact"))).toBe(true);
    });

    it("151 — lightingRate < 50 produces critical insight", () => {
      const lights = manyLighting(1, {
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("lighting adequacy"))).toBe(true);
    });

    it("152 — childSatisfactionRate < 50 produces critical insight", () => {
      const sats = manySatisfaction(4, { overall_satisfaction: 1 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("child satisfaction"))).toBe(true);
    });

    it("153 — no space assessments produces critical insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [makeNoise()],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No study space assessments"))).toBe(true);
    });

    it("154 — no equipment assessments produces critical insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: [],
        study_space_records: [makeStudySpace()],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No equipment assessments"))).toBe(true);
    });

    it("155 — studySpaceRate 50-69 produces warning insight", () => {
      const spaces = [makeStudySpace({
        dedicated_space_available: true, space_adequate_size: true,
        space_clean_tidy: true, space_free_from_distractions: true,
        private_when_needed: true, personalised_for_child: true,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Study space quality at 60%"))).toBe(true);
    });

    it("156 — noiseEnvironmentRate 50-69 produces warning insight", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_level_acceptable: true }),
        makeNoise({ id: "ne_1", noise_level_acceptable: false }),
      ]; // 50%
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Noise environment compliance at 50%"))).toBe(true);
    });

    it("157 — equipmentRate 50-69 produces warning insight", () => {
      const equips = [makeEquipment({
        desk_available: true, chair_suitable: true,
        computer_laptop_available: true, internet_access: true,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: equips,
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Equipment availability at 57%"))).toBe(true);
    });

    it("158 — lightingRate 50-69 produces warning insight", () => {
      const lights = [makeLighting({
        natural_light_adequate: true, artificial_light_adequate: true,
        desk_lamp_available: true, glare_free: false, meets_recommended_standard: false,
      })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: lights,
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Lighting adequacy at 60%"))).toBe(true);
    });

    it("159 — childSatisfactionRate 50-69 produces warning insight", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", overall_satisfaction: 5 }),
        makeSatisfaction({ id: "cs_1", overall_satisfaction: 1 }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("160 — concentrationRate 50-69 produces warning insight", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", feels_able_to_concentrate: true }),
        makeSatisfaction({ id: "cs_1", feels_able_to_concentrate: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Concentration ability at 50%"))).toBe(true);
    });

    it("161 — studySupportRate 50-69 produces warning insight", () => {
      const sats = [
        makeSatisfaction({ id: "cs_0", feels_supported_in_study: true }),
        makeSatisfaction({ id: "cs_1", feels_supported_in_study: false }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: sats,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Study support perception at 50%"))).toBe(true);
    });

    it("162 — avgHomeworkCompletion 50-69 produces warning insight", () => {
      const sats = manySatisfaction(4, { homework_completion_rate_self_reported: 60 });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("homework completion at 60%"))).toBe(true);
    });

    it("163 — changeRequestRate > 50 produces warning insight", () => {
      const sats = manySatisfaction(4, { would_change_anything: true });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: sats,
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("would change something"))).toBe(true);
    });

    it("164 — poorConditionRate 21-30 produces warning insight", () => {
      // 1 of 4 = 25%
      const equips = [
        makeEquipment({ id: "eq_0", equipment_condition: "poor" }),
        makeEquipment({ id: "eq_1", equipment_condition: "good" }),
        makeEquipment({ id: "eq_2", equipment_condition: "good" }),
        makeEquipment({ id: "eq_3", equipment_condition: "good" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("poor condition"))).toBe(true);
    });

    it("165 — noise source analysis produces warning insight", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_source: "peers" }),
        makeNoise({ id: "ne_1", noise_source: "peers" }),
        makeNoise({ id: "ne_2", noise_source: "external" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.text.includes("Most common noise sources"))).toBe(true);
    });

    it("166 — noise source analysis replaces underscores with spaces", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_source: "building_works" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      const noiseInsight = r.insights.find((i) => i.text.includes("noise sources"));
      expect(noiseInsight?.text).toContain("building works");
    });

    it("167 — noise source 'none' is excluded from noise source analysis", () => {
      const noises = manyNoise(4, { noise_source: "none" });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.text.includes("Most common noise sources"))).toBe(false);
    });

    it("168 — space type analysis produces warning insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.text.includes("Study space types in use"))).toBe(true);
    });

    it("169 — space type analysis replaces underscores with spaces", () => {
      const spaces = [makeStudySpace({ space_type: "shared_study_room" })];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      const typeInsight = r.insights.find((i) => i.text.includes("Study space types in use"));
      expect(typeInsight?.text).toContain("shared study room");
    });

    it("170 — outstanding rating produces positive outstanding insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding homework environment"))).toBe(true);
    });

    it("171 — high space+noise produces positive combined insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("study space quality with") && i.text.includes("noise compliance"))).toBe(true);
    });

    it("172 — high equipment+computer produces positive combined insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("equipment availability with") && i.text.includes("computer access"))).toBe(true);
    });

    it("173 — high lighting rate produces positive insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("lighting adequacy"))).toBe(true);
    });

    it("174 — high satisfaction+concentration produces positive combined insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child satisfaction with") && i.text.includes("concentration ability"))).toBe(true);
    });

    it("175 — high studySupportRate produces positive insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("feel supported in study"))).toBe(true);
    });

    it("176 — high homework completion produces positive insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("homework completion at 90%"))).toBe(true);
    });

    it("177 — high specialist provision produces positive insight", () => {
      const equips = manyEquipment(4, {
        specialist_equipment_needed: true,
        specialist_equipment_provided: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({ equipment_records: equips }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("specialist equipment provision"))).toBe(true);
    });

    it("178 — high space issue resolution produces positive insight", () => {
      const spaces = manyStudySpaces(4, {
        issues_identified: ["old desk"],
        issues_resolved: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({ study_space_records: spaces }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("study space issues resolved"))).toBe(true);
    });

    it("179 — high noise mitigation produces positive insight", () => {
      const noises = manyNoise(4, {
        noise_level_acceptable: false,
        noise_mitigation_in_place: true,
        mitigation_effective: true,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: noises,
        study_space_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("noise mitigation in place"))).toBe(true);
    });

    it("180 — high utilisation produces positive insight", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("study space coverage"))).toBe(true);
    });
  });

  // ── 16. Headlines ───────────────────────────────────────────────────────

  describe("headlines", () => {
    it("181 — outstanding headline text", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("182 — good headline mentions strengths count", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        child_satisfaction_records: [],
        lighting_records: [],
      }));
      expect(r.study_rating).toBe("good");
      expect(r.headline).toContain("strength");
    });

    it("183 — adequate headline mentions concerns count", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        study_space_records: [],
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: manySatisfaction(4),
      }));
      expect(r.study_rating).toBe("adequate");
      expect(r.headline).toContain("concern");
    });

    it("184 — inadequate headline mentions urgent action", () => {
      const spaces = manyStudySpaces(1, {
        dedicated_space_available: false, space_adequate_size: false,
        space_clean_tidy: false, space_free_from_distractions: false,
        private_when_needed: false, personalised_for_child: false,
        temperature_comfortable: false, ventilation_adequate: false,
        accessibility_suitable: false, storage_for_materials: false,
      });
      const noises = manyNoise(1, { noise_level_acceptable: false, impact_on_concentration: "severe" });
      const equips = manyEquipment(1, {
        desk_available: false, chair_suitable: false,
        computer_laptop_available: false, internet_access: false,
        stationery_available: false, textbooks_available: false,
        equipment_age_appropriate: false, equipment_condition: "poor",
      });
      const lights = manyLighting(1, {
        natural_light_adequate: false, artificial_light_adequate: false,
        desk_lamp_available: false, glare_free: false, meets_recommended_standard: false,
      });
      const sats = manySatisfaction(1, {
        overall_satisfaction: 1, feels_able_to_concentrate: false,
        feels_supported_in_study: false, homework_completion_rate_self_reported: 10,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: spaces,
        noise_environment_records: noises,
        equipment_records: equips,
        lighting_records: lights,
        child_satisfaction_records: sats,
      }));
      expect(r.study_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ── 17. Mixed Scenarios ─────────────────────────────────────────────────

  describe("mixed scenarios", () => {
    it("185 — only study space records with children yields adequate/good", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        noise_environment_records: [],
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // base 52 + 4 (space>=90) + 3 (util>=80) = 59 => adequate
      expect(r.study_rating).toBe("adequate");
    });

    it("186 — single child with all-perfect records", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 1,
        study_space_records: [makeStudySpace()],
        noise_environment_records: [makeNoise()],
        equipment_records: [makeEquipment()],
        lighting_records: [makeLighting()],
        child_satisfaction_records: [makeSatisfaction()],
      }));
      expect(r.study_rating).toBe("outstanding");
      expect(r.study_score).toBe(80);
    });

    it("187 — good condition rate requires 'excellent' or 'good'", () => {
      const equips = [
        makeEquipment({ id: "eq_0", equipment_condition: "excellent" }),
        makeEquipment({ id: "eq_1", equipment_condition: "good" }),
        makeEquipment({ id: "eq_2", equipment_condition: "fair" }),
        makeEquipment({ id: "eq_3", equipment_condition: "fair" }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
        study_space_records: [],
        noise_environment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // goodConditionRate = 50% (2/4) => no goodCondition bonus
      // equipmentRate still 100% => +4 bonus
      expect(r.study_score).toBe(56); // 52 + 4 (equip>=90)
    });

    it("188 — mitigation effective requires noise_mitigation_in_place", () => {
      const noises = [
        makeNoise({ id: "ne_0", noise_mitigation_in_place: false, mitigation_effective: true }),
        makeNoise({ id: "ne_1", noise_mitigation_in_place: true, mitigation_effective: true }),
      ];
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 2,
        study_space_records: [],
        noise_environment_records: noises,
        equipment_records: [],
        lighting_records: [],
        child_satisfaction_records: [],
      }));
      // mitigationEffectivenessRate: 1 effective with mitigation / 1 total with mitigation = 100%
      // This doesn't directly affect score, but no issue
      expect(r.noise_environment_rate).toBe(100);
    });

    it("189 — large dataset with 50 records processes correctly", () => {
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        total_children: 50,
        study_space_records: manyStudySpaces(50),
        noise_environment_records: manyNoise(50),
        equipment_records: manyEquipment(50),
        lighting_records: manyLighting(50),
        child_satisfaction_records: manySatisfaction(50),
      }));
      expect(r.study_rating).toBe("outstanding");
      expect(r.total_space_assessments).toBe(50);
    });

    it("190 — specialist equipment not needed means no specialist provision strength/concern", () => {
      const equips = manyEquipment(4, {
        specialist_equipment_needed: false,
        specialist_equipment_provided: false,
      });
      const r = computeHomeworkEnvironmentStudySpace(baseInput({
        equipment_records: equips,
      }));
      expect(r.strengths.some((s) => s.includes("specialist equipment provision"))).toBe(false);
    });
  });
});
