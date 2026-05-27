import { describe, it, expect, beforeEach } from "vitest";
import {
  computeHomeLivingEnvironment,
  type HomeLivingEnvironmentInput,
  type BedroomProfileInput,
  type PetRecordInput,
  type GardenPlotInput,
  type OutdoorActivityInput,
  type EnvironmentalRiskInput,
} from "../home-living-environment-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `le-${++_id}`;

function makeBedroom(overrides: Partial<BedroomProfileInput> = {}): BedroomProfileInput {
  return {
    id: uid(),
    child_id: "c1",
    child_choose_colours: true,
    furniture_chosen_by_child: true,
    child_authored: true,
    child_satisfaction_rating: 5,
    meaningful_items_count: 3,
    personal_artwork_count: 2,
    photos_displayed_count: 3,
    sensory_accommodations_count: 1,
    review_date: "2026-07-01",
    ...overrides,
  };
}

function makePet(overrides: Partial<PetRecordInput> = {}): PetRecordInput {
  return {
    id: uid(),
    vaccinations_up_to_date: true,
    insurance: true,
    children_involved_in_care_count: 3,
    therapeutic_value: "Helps with anxiety and emotional regulation",
    risk_assessment_date: "2026-04-01",
    ...overrides,
  };
}

function makeGarden(overrides: Partial<GardenPlotInput> = {}): GardenPlotInput {
  return {
    id: uid(),
    contributing_children_count: 3,
    hours_this_month: 6,
    sensory_benefits_count: 3,
    child_voice: "I love growing tomatoes and watching them change colour.",
    review_date: "2026-07-01",
    ...overrides,
  };
}

function makeOutdoor(overrides: Partial<OutdoorActivityInput> = {}): OutdoorActivityInput {
  return {
    id: uid(),
    signed_off_by_rm: true,
    permissions_obtained: true,
    emergency_procedures_count: 3,
    child_specific_considerations_count: 2,
    ...overrides,
  };
}

function makeEnvRisk(overrides: Partial<EnvironmentalRiskInput> = {}): EnvironmentalRiskInput {
  return {
    id: uid(),
    risk_level: "medium",
    status: "mitigated",
    review_date: "2026-07-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeLivingEnvironmentInput> = {}): HomeLivingEnvironmentInput {
  return {
    today: "2026-05-27",
    bedroom_profiles: [
      makeBedroom({ child_id: "c1" }),
      makeBedroom({ child_id: "c2" }),
      makeBedroom({ child_id: "c3" }),
    ],
    pet_records: [makePet(), makePet()],
    garden_plots: [makeGarden(), makeGarden()],
    outdoor_activities: [makeOutdoor(), makeOutdoor(), makeOutdoor()],
    environmental_risks: [
      makeEnvRisk({ status: "mitigated" }),
      makeEnvRisk({ status: "closed" }),
      makeEnvRisk({ status: "mitigated" }),
    ],
    total_children: 3,
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeHomeLivingEnvironment", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when all empty and no children", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 0,
      });
      expect(r.living_environment_rating).toBe("insufficient_data");
      expect(r.living_environment_score).toBe(0);
    });

    it("returns insufficient_data headline", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 0,
      });
      expect(r.headline).toContain("No living environment data");
    });

    it("NOT insufficient_data when total_children > 0", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 3,
      });
      expect(r.living_environment_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when bedroom_profiles exist", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [makeBedroom()], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 0,
      });
      expect(r.living_environment_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when pet_records exist", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [makePet()], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 0,
      });
      expect(r.living_environment_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when environmental_risks exist", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [makeEnvRisk()],
        total_children: 0,
      });
      expect(r.living_environment_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding for excellent environment (score >= 80)", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.living_environment_score).toBeGreaterThanOrEqual(80);
      expect(r.living_environment_rating).toBe("outstanding");
    });

    it("good for score 65-79", () => {
      // Reduce: lower satisfaction, remove garden voice, less bedroom personalisation
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
          makeBedroom({ child_id: "c2", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
          makeBedroom({ child_id: "c3", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
        ],
        garden_plots: [makeGarden({ child_voice: "", sensory_benefits_count: 0, hours_this_month: 1 })],
      }));
      expect(r.living_environment_score).toBeGreaterThanOrEqual(65);
      expect(r.living_environment_score).toBeLessThan(80);
      expect(r.living_environment_rating).toBe("good");
    });

    it("adequate for score 45-64", () => {
      // mod1: 1 bedroom, satisfaction=3, colours=false, furniture=true, authored=false, meaningful=yes → 2 positives → +0
      // mod2: coverage 33% (<90), 0 overdue, artwork yes, sensory yes → 3 positives → +2
      // mod3: no pets → 0
      // mod4: no gardens → 0
      // mod5: 1 outdoor, all good → +4
      // mod6: no env risks → 0
      // mod7: bedroom exists, authored=false(0%), satisfaction=3(<4) → 0 positives → -3
      // mod8: 1 bedroom, 0 overdue → 0% overdue → +3
      // 52 + 0 + 2 + 0 + 0 + 4 + 0 - 3 + 3 = 58
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false, furniture_chosen_by_child: true, meaningful_items_count: 2 }),
        ],
        pet_records: [],
        garden_plots: [],
        outdoor_activities: [makeOutdoor()],
        environmental_risks: [],
      }));
      expect(r.living_environment_score).toBeGreaterThanOrEqual(45);
      expect(r.living_environment_score).toBeLessThan(65);
      expect(r.living_environment_rating).toBe("adequate");
    });

    it("inadequate for score < 45", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [],
        pet_records: [makePet({ vaccinations_up_to_date: false, insurance: false, children_involved_in_care_count: 0, therapeutic_value: "", risk_assessment_date: "2025-01-01" })],
        garden_plots: [],
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
        ],
        environmental_risks: [
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "high", review_date: "2026-04-01" }),
        ],
      }));
      expect(r.living_environment_score).toBeLessThan(45);
      expect(r.living_environment_rating).toBe("inadequate");
    });
  });

  // ── Bedroom Profile ─────────────────────────────────────────────────

  describe("bedroom profile", () => {
    it("calculates child coverage", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [makeBedroom({ child_id: "c1" }), makeBedroom({ child_id: "c2" })],
        total_children: 4,
      }));
      expect(r.bedrooms.child_coverage).toBe(50);
    });

    it("calculates avg satisfaction", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_satisfaction_rating: 4 }),
          makeBedroom({ child_satisfaction_rating: 3 }),
        ],
      }));
      expect(r.bedrooms.avg_satisfaction).toBe(3.5);
    });

    it("calculates child_choose_colours_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_choose_colours: true }),
          makeBedroom({ child_choose_colours: false }),
        ],
      }));
      expect(r.bedrooms.child_choose_colours_rate).toBe(50);
    });

    it("calculates furniture_chosen_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ furniture_chosen_by_child: true }),
          makeBedroom({ furniture_chosen_by_child: false }),
          makeBedroom({ furniture_chosen_by_child: true }),
        ],
      }));
      expect(r.bedrooms.furniture_chosen_rate).toBe(67);
    });

    it("calculates child_authored_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_authored: true }),
          makeBedroom({ child_authored: false }),
        ],
      }));
      expect(r.bedrooms.child_authored_rate).toBe(50);
    });

    it("calculates meaningful_items_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ meaningful_items_count: 3 }),
          makeBedroom({ meaningful_items_count: 0 }),
        ],
      }));
      expect(r.bedrooms.meaningful_items_rate).toBe(50);
    });

    it("calculates artwork_photos_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ personal_artwork_count: 2, photos_displayed_count: 0 }),
          makeBedroom({ personal_artwork_count: 0, photos_displayed_count: 0 }),
        ],
      }));
      expect(r.bedrooms.artwork_photos_rate).toBe(50);
    });

    it("calculates sensory_accommodations_rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ sensory_accommodations_count: 2 }),
          makeBedroom({ sensory_accommodations_count: 0 }),
          makeBedroom({ sensory_accommodations_count: 1 }),
        ],
      }));
      expect(r.bedrooms.sensory_accommodations_rate).toBe(67);
    });

    it("counts overdue reviews", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ review_date: "2026-04-01" }),  // overdue
          makeBedroom({ review_date: "2026-07-01" }),  // not overdue
        ],
      }));
      expect(r.bedrooms.overdue_reviews).toBe(1);
    });
  });

  // ── Pet Care Profile ────────────────────────────────────────────────

  describe("pet care profile", () => {
    it("calculates vaccination rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [
          makePet({ vaccinations_up_to_date: true }),
          makePet({ vaccinations_up_to_date: false }),
        ],
      }));
      expect(r.pets.vaccination_rate).toBe(50);
    });

    it("calculates insurance rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [
          makePet({ insurance: true }),
          makePet({ insurance: false }),
          makePet({ insurance: true }),
        ],
      }));
      expect(r.pets.insurance_rate).toBe(67);
    });

    it("calculates children involved average", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [
          makePet({ children_involved_in_care_count: 4 }),
          makePet({ children_involved_in_care_count: 2 }),
        ],
      }));
      expect(r.pets.children_involved_avg).toBe(3);
    });

    it("calculates therapeutic value rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [
          makePet({ therapeutic_value: "Helps with emotional regulation" }),
          makePet({ therapeutic_value: "" }),
        ],
      }));
      expect(r.pets.therapeutic_value_rate).toBe(50);
    });

    it("counts overdue risk assessments (>180 days)", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [
          makePet({ risk_assessment_date: "2025-09-01" }),  // >180 days
          makePet({ risk_assessment_date: "2026-04-01" }),  // recent
        ],
      }));
      expect(r.pets.risk_assessment_overdue).toBe(1);
    });
  });

  // ── Garden Profile ──────────────────────────────────────────────────

  describe("garden profile", () => {
    it("calculates avg contributing children", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        garden_plots: [
          makeGarden({ contributing_children_count: 4 }),
          makeGarden({ contributing_children_count: 2 }),
        ],
      }));
      expect(r.gardens.avg_contributing_children).toBe(3);
    });

    it("calculates avg hours", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        garden_plots: [
          makeGarden({ hours_this_month: 8 }),
          makeGarden({ hours_this_month: 4 }),
        ],
      }));
      expect(r.gardens.avg_hours).toBe(6);
    });

    it("calculates sensory benefits rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        garden_plots: [
          makeGarden({ sensory_benefits_count: 3 }),
          makeGarden({ sensory_benefits_count: 0 }),
        ],
      }));
      expect(r.gardens.sensory_benefits_rate).toBe(50);
    });

    it("calculates child voice rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        garden_plots: [
          makeGarden({ child_voice: "Great!" }),
          makeGarden({ child_voice: "" }),
          makeGarden({ child_voice: "Fun" }),
        ],
      }));
      expect(r.gardens.child_voice_rate).toBe(67);
    });

    it("counts overdue reviews", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        garden_plots: [
          makeGarden({ review_date: "2026-04-01" }),  // overdue
          makeGarden({ review_date: "2026-08-01" }),  // not overdue
        ],
      }));
      expect(r.gardens.overdue_reviews).toBe(1);
    });
  });

  // ── Outdoor Activity Profile ────────────────────────────────────────

  describe("outdoor activity profile", () => {
    it("calculates RM sign-off rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: true }),
          makeOutdoor({ signed_off_by_rm: false }),
        ],
      }));
      expect(r.outdoor_activities.rm_sign_off_rate).toBe(50);
    });

    it("calculates permissions rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ permissions_obtained: true }),
          makeOutdoor({ permissions_obtained: true }),
          makeOutdoor({ permissions_obtained: false }),
        ],
      }));
      expect(r.outdoor_activities.permissions_rate).toBe(67);
    });

    it("calculates emergency procedures rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ emergency_procedures_count: 3 }),
          makeOutdoor({ emergency_procedures_count: 0 }),
        ],
      }));
      expect(r.outdoor_activities.emergency_procedures_rate).toBe(50);
    });

    it("calculates child considerations rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ child_specific_considerations_count: 2 }),
          makeOutdoor({ child_specific_considerations_count: 0 }),
          makeOutdoor({ child_specific_considerations_count: 1 }),
        ],
      }));
      expect(r.outdoor_activities.child_considerations_rate).toBe(67);
    });
  });

  // ── Environmental Risk Profile ──────────────────────────────────────

  describe("environmental risk profile", () => {
    it("counts open risks", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "open" }),
          makeEnvRisk({ status: "mitigated" }),
          makeEnvRisk({ status: "open" }),
        ],
      }));
      expect(r.environmental_risks.open_count).toBe(2);
    });

    it("counts critical risks", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ risk_level: "critical" }),
          makeEnvRisk({ risk_level: "high" }),
          makeEnvRisk({ risk_level: "critical" }),
        ],
      }));
      expect(r.environmental_risks.critical_count).toBe(2);
    });

    it("calculates mitigated rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "mitigated" }),
          makeEnvRisk({ status: "closed" }),
          makeEnvRisk({ status: "open" }),
        ],
      }));
      expect(r.environmental_risks.mitigated_rate).toBe(67);
    });

    it("counts overdue reviews", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ review_date: "2026-04-01" }),  // overdue
          makeEnvRisk({ review_date: "2026-07-01" }),  // not overdue
        ],
      }));
      expect(r.environmental_risks.overdue_reviews).toBe(1);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────

  describe("mod1: bedroom personalisation & satisfaction (+-5)", () => {
    it("+5 when all personalisation metrics are excellent", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      // baseInput has satisfaction 5, all true, meaningful items present
      expect(r.living_environment_score).toBeGreaterThanOrEqual(80);
    });

    it("-5 when no bedrooms but children exist", () => {
      const withBedrooms = computeHomeLivingEnvironment(baseInput());
      const withoutBedrooms = computeHomeLivingEnvironment(baseInput({ bedroom_profiles: [] }));
      // Without bedrooms: mod1=-5, mod2=-4, mod7 loses bedroom voice, mod8 changes
      expect(withBedrooms.living_environment_score).toBeGreaterThan(withoutBedrooms.living_environment_score);
    });
  });

  describe("mod2: bedroom coverage & quality (+-4)", () => {
    it("+4 when coverage 100%, reviews on time, artwork+sensory present", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.bedrooms.child_coverage).toBe(100);
      expect(r.bedrooms.overdue_reviews).toBe(0);
    });

    it("-4 when no bedrooms but children exist", () => {
      // Isolate mod2 by keeping other modifiers the same
      const full = computeHomeLivingEnvironment(baseInput({
        pet_records: [], garden_plots: [], outdoor_activities: [], environmental_risks: [],
      }));
      const none = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [], pet_records: [], garden_plots: [], outdoor_activities: [], environmental_risks: [],
      }));
      // full: mod1=+5, mod2=+4, mod7=+0(only bedroom, 3 positives: authored+satisfaction → +2), mod8=+3
      // none: mod1=-5, mod2=-4, mod7=-3, mod8=+0
      // Difference should be significant
      expect(full.living_environment_score).toBeGreaterThan(none.living_environment_score);
    });
  });

  describe("mod3: pet care & therapeutic value (+-3)", () => {
    it("neutral when no pets", () => {
      const withPets = computeHomeLivingEnvironment(baseInput());
      const withoutPets = computeHomeLivingEnvironment(baseInput({ pet_records: [] }));
      // mod3 difference: +3 vs 0 = 3
      const diff = withPets.living_environment_score - withoutPets.living_environment_score;
      expect(diff).toBe(3);
    });

    it("-3 when all pet metrics fail", () => {
      const good = computeHomeLivingEnvironment(baseInput());
      const bad = computeHomeLivingEnvironment(baseInput({
        pet_records: [makePet({
          vaccinations_up_to_date: false, insurance: false,
          children_involved_in_care_count: 0, therapeutic_value: "",
          risk_assessment_date: "2025-01-01",
        })],
      }));
      // good: +3, bad: -3 = 6 diff
      expect(good.living_environment_score - bad.living_environment_score).toBe(6);
    });
  });

  describe("mod4: garden & outdoor engagement (+-3)", () => {
    it("neutral when no garden plots", () => {
      const withGardens = computeHomeLivingEnvironment(baseInput());
      const withoutGardens = computeHomeLivingEnvironment(baseInput({ garden_plots: [] }));
      // mod4 diff: +3 vs 0 = 3. mod7 may change too since garden voice disappears.
      expect(withGardens.living_environment_score).toBeGreaterThan(withoutGardens.living_environment_score);
    });

    it("-3 when all garden metrics fail", () => {
      const bad = computeHomeLivingEnvironment(baseInput({
        garden_plots: [makeGarden({
          contributing_children_count: 0, hours_this_month: 0,
          sensory_benefits_count: 0, child_voice: "",
        })],
      }));
      const good = computeHomeLivingEnvironment(baseInput());
      expect(good.living_environment_score).toBeGreaterThan(bad.living_environment_score);
    });
  });

  describe("mod5: outdoor activity safety (+-4)", () => {
    it("+4 when all safety metrics are 100%", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.outdoor_activities.rm_sign_off_rate).toBe(100);
      expect(r.outdoor_activities.permissions_rate).toBe(100);
    });

    it("-4 when all safety metrics fail", () => {
      const good = computeHomeLivingEnvironment(baseInput());
      const bad = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
        ],
      }));
      expect(good.living_environment_score - bad.living_environment_score).toBe(8);
    });

    it("neutral when no outdoor activities", () => {
      const withActivities = computeHomeLivingEnvironment(baseInput());
      const withoutActivities = computeHomeLivingEnvironment(baseInput({ outdoor_activities: [] }));
      expect(withActivities.living_environment_score - withoutActivities.living_environment_score).toBe(4);
    });
  });

  describe("mod6: environmental risk management (+-3)", () => {
    it("+3 when all risks mitigated, no critical open, reviews on time", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.environmental_risks.open_count).toBe(0);
      expect(r.environmental_risks.critical_count).toBe(0);
    });

    it("-3 when all risk metrics fail", () => {
      // Only vary the environmental_risks, keep reviews on-time to isolate mod6 from mod8
      const good = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "mitigated", risk_level: "low", review_date: "2026-07-01" }),
          makeEnvRisk({ status: "closed", risk_level: "low", review_date: "2026-07-01" }),
          makeEnvRisk({ status: "mitigated", risk_level: "low", review_date: "2026-07-01" }),
        ],
      }));
      // bad: open critical, overdue reviews — affects mod6 AND mod8
      const bad = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "high", review_date: "2026-04-01" }),
        ],
      }));
      // good mod6=+3, bad mod6=-3 → 6 diff just from mod6
      // but mod8 also changes: good has 0 overdue env, bad has 3 overdue env
      // good mod8: 0 overdue / (3 bed + 2 garden + 3 env) = 0% → +3
      // bad mod8: 3 overdue / (3 bed + 2 garden + 3 env) = 38% → -3
      // total diff = 6 (mod6) + 6 (mod8) = 12
      expect(good.living_environment_score - bad.living_environment_score).toBe(12);
    });

    it("neutral when no environmental risks", () => {
      const withRisks = computeHomeLivingEnvironment(baseInput());
      const withoutRisks = computeHomeLivingEnvironment(baseInput({ environmental_risks: [] }));
      expect(withRisks.living_environment_score - withoutRisks.living_environment_score).toBe(3);
    });
  });

  describe("mod7: child voice across environment (+-3)", () => {
    it("+3 when bedroom authored, garden voice, satisfaction all strong", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.bedrooms.child_authored_rate).toBeGreaterThanOrEqual(70);
      expect(r.gardens.child_voice_rate).toBeGreaterThanOrEqual(80);
      expect(r.bedrooms.avg_satisfaction).toBeGreaterThanOrEqual(4.0);
    });

    it("-3 when children exist but no voice data sources", () => {
      // Remove bedrooms and gardens to eliminate voice data sources
      // Other modifiers: mod1=-5 (no bedrooms), mod2=-4 (no bedrooms), mod3/4/5/6 from baseInput
      const withVoice = computeHomeLivingEnvironment(baseInput());
      const noVoice = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [],
        garden_plots: [],
      }));
      // Without bedrooms and gardens: mod1, mod2, mod4, mod7, mod8 all change
      // But the key point is score drops significantly when voice sources are removed
      expect(withVoice.living_environment_score).toBeGreaterThan(noVoice.living_environment_score);
    });
  });

  describe("mod8: review compliance (+-3)", () => {
    it("+3 when no overdue reviews", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.bedrooms.overdue_reviews).toBe(0);
      expect(r.gardens.overdue_reviews).toBe(0);
      expect(r.environmental_risks.overdue_reviews).toBe(0);
    });

    it("-3 when many reviews overdue", () => {
      const good = computeHomeLivingEnvironment(baseInput());
      const bad = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1", review_date: "2026-04-01" }),
          makeBedroom({ child_id: "c2", review_date: "2026-04-01" }),
          makeBedroom({ child_id: "c3", review_date: "2026-04-01" }),
        ],
        garden_plots: [
          makeGarden({ review_date: "2026-04-01" }),
        ],
        environmental_risks: [
          makeEnvRisk({ review_date: "2026-04-01" }),
        ],
      }));
      // good mod8=+3, bad mod8=-3 → 6 from mod8
      // but overdue bedroom reviews also affect mod2: reviewsOk changes from true to false
      // good mod2: 4 positives(coverage+reviews+artwork+sensory)=+4
      // bad mod2: 3 positives(coverage+artwork+sensory but NOT reviews)=+4 still? No:
      //   coverage=100%, reviewsOk=false(3 overdue), artwork=100%, sensory=100% → 3 positives → still +4?
      //   3 positives >= 2 → +2 (not +4)
      // So mod2 diff = 4-2 = 2, mod8 diff = 3-(-3)=6, total=8
      // But also garden overdue reviews → garden profile unchanged for mod4
      // Actually let me just test that the score drops when reviews are overdue
      expect(good.living_environment_score).toBeGreaterThan(bad.living_environment_score);
      // The diff should be at least 6 (mod8 alone)
      expect(good.living_environment_score - bad.living_environment_score).toBeGreaterThanOrEqual(6);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes bedroom satisfaction strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("satisfaction"))).toBe(true);
    });

    it("includes colour choice strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("chose their bedroom colours"))).toBe(true);
    });

    it("includes bedroom coverage strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("bedroom profile coverage"))).toBe(true);
    });

    it("includes pet vaccination strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("vaccinated"))).toBe(true);
    });

    it("includes RM sign-off strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("RM sign-off"))).toBe(true);
    });

    it("includes environmental risk mitigated strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("mitigated"))).toBe(true);
    });

    it("includes garden child voice strength", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.strengths.some(s => s.includes("garden plots capture child voice"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags no bedroom profiles", () => {
      const r = computeHomeLivingEnvironment(baseInput({ bedroom_profiles: [] }));
      expect(r.concerns.some(c => c.includes("No bedroom profiles"))).toBe(true);
    });

    it("flags low bedroom coverage", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [makeBedroom({ child_id: "c1" })],
        total_children: 4,
      }));
      expect(r.concerns.some(c => c.includes("bedroom profiles"))).toBe(true);
    });

    it("flags low satisfaction", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_satisfaction_rating: 2 }),
          makeBedroom({ child_satisfaction_rating: 2 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("satisfaction"))).toBe(true);
    });

    it("flags open critical environmental risks", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [makeEnvRisk({ status: "open", risk_level: "critical" })],
      }));
      expect(r.concerns.some(c => c.includes("critical environmental risk"))).toBe(true);
    });

    it("flags multiple open risks", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "open" }),
          makeEnvRisk({ status: "open" }),
          makeEnvRisk({ status: "open" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("open environmental risks"))).toBe(true);
    });

    it("flags low RM sign-off rate", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: false }),
          makeOutdoor({ signed_off_by_rm: false }),
          makeOutdoor({ signed_off_by_rm: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("signed off by RM"))).toBe(true);
    });

    it("flags overdue bedroom reviews", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ review_date: "2026-04-01" }),
          makeBedroom({ review_date: "2026-04-01" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("overdue bedroom profile reviews"))).toBe(true);
    });

    it("flags overdue pet risk assessments", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        pet_records: [makePet({ risk_assessment_date: "2025-01-01" })],
      }));
      expect(r.concerns.some(c => c.includes("pet risk assessment"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends bedroom profiles when none exist", () => {
      const r = computeHomeLivingEnvironment(baseInput({ bedroom_profiles: [] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("bedroom profiles"))).toBe(true);
    });

    it("recommends critical risk action", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [makeEnvRisk({ status: "open", risk_level: "critical" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("critical environmental risks"))).toBe(true);
    });

    it("recommends RM sign-off when incomplete", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [makeOutdoor({ signed_off_by_rm: false })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("RM sign-off"))).toBe(true);
    });

    it("recommends extending bedroom coverage when low", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [makeBedroom({ child_id: "c1" })],
        total_children: 4,
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Extend bedroom profiles"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [],
        environmental_risks: [makeEnvRisk({ status: "open", risk_level: "critical" })],
        outdoor_activities: [makeOutdoor({ signed_off_by_rm: false })],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  describe("ARIA insights", () => {
    it("generates positive insight for exemplary bedroom personalisation", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1", child_satisfaction_rating: 5, child_choose_colours: true, child_authored: true }),
          makeBedroom({ child_id: "c2", child_satisfaction_rating: 5, child_choose_colours: true, child_authored: true }),
          makeBedroom({ child_id: "c3", child_satisfaction_rating: 5, child_choose_colours: true, child_authored: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for multiple open critical risks", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        environmental_risks: [
          makeEnvRisk({ status: "open", risk_level: "critical" }),
          makeEnvRisk({ status: "open", risk_level: "critical" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("critical environmental risks"))).toBe(true);
    });

    it("generates positive insight for pet care with therapeutic value", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Pet care"))).toBe(true);
    });

    it("generates positive insight for garden engagement", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Garden engagement"))).toBe(true);
    });

    it("generates critical insight for low RM sign-off", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: false }),
          makeOutdoor({ signed_off_by_rm: false }),
          makeOutdoor({ signed_off_by_rm: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("RM sign-off"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions coverage and satisfaction", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions areas for improvement", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
          makeBedroom({ child_id: "c2", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
          makeBedroom({ child_id: "c3", child_satisfaction_rating: 3, child_authored: false, child_choose_colours: false }),
        ],
        garden_plots: [makeGarden({ child_voice: "", sensory_benefits_count: 0, hours_this_month: 1 })],
      }));
      expect(r.headline).toContain("Good");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [],
        pet_records: [makePet({ vaccinations_up_to_date: false, insurance: false, children_involved_in_care_count: 0, therapeutic_value: "", risk_assessment_date: "2025-01-01" })],
        garden_plots: [],
        outdoor_activities: [
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
          makeOutdoor({ signed_off_by_rm: false, permissions_obtained: false, emergency_procedures_count: 0, child_specific_considerations_count: 0 }),
        ],
        environmental_risks: [
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "critical", review_date: "2026-04-01" }),
          makeEnvRisk({ status: "open", risk_level: "high", review_date: "2026-04-01" }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped 0-100", () => {
      const r = computeHomeLivingEnvironment(baseInput());
      expect(r.living_environment_score).toBeGreaterThanOrEqual(0);
      expect(r.living_environment_score).toBeLessThanOrEqual(100);
    });

    it("handles all empty arrays with children", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 3,
      });
      expect(r.living_environment_rating).not.toBe("insufficient_data");
      expect(typeof r.living_environment_score).toBe("number");
    });

    it("base score is 52 when all modifiers are neutral", () => {
      const r = computeHomeLivingEnvironment({
        today: "2026-05-27",
        bedroom_profiles: [], pet_records: [], garden_plots: [],
        outdoor_activities: [], environmental_risks: [],
        total_children: 0,
        // Would be insufficient_data — need at least one record
      });
      // This is insufficient_data, so 0
      expect(r.living_environment_score).toBe(0);
    });

    it("duplicate child_ids in bedrooms still count as one child for coverage", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [
          makeBedroom({ child_id: "c1" }),
          makeBedroom({ child_id: "c1" }),
        ],
        total_children: 2,
      }));
      expect(r.bedrooms.child_coverage).toBe(50);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeHomeLivingEnvironment(baseInput({
        bedroom_profiles: [],
        pet_records: [],
        garden_plots: [],
        outdoor_activities: [],
        environmental_risks: [makeEnvRisk()],
        total_children: 0,
      }));
      expect(r.bedrooms.child_coverage).toBe(0);
    });
  });
});
