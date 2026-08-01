import { describe, it, expect } from "vitest";
import {
  computePetCareMetrics,
  identifyPetCareAlerts,
} from "./pet-care-responsibility-service";
import type { PetCareResponsibilityRecord } from "./pet-care-responsibility-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PetCareResponsibilityRecord> = {}): PetCareResponsibilityRecord {
  return {
    id: "pcr-1",
    home_id: "home-1",
    pet_type: "dog",
    care_quality: "good",
    responsibility_level: "shared_responsibility",
    therapeutic_impact: "positive",
    session_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "staff-1",
    animal_welfare_met: true,
    veterinary_care_current: true,
    child_chose_interaction: true,
    supervision_adequate: true,
    hygiene_maintained: true,
    allergy_checked: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    risk_assessment_done: true,
    empathy_development_noted: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePetCareMetrics ----------------------------------------------------

describe("computePetCareMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePetCareMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.neglectful_count).toBe(0);
    expect(m.not_involved_count).toBe(0);
    expect(m.negative_impact_count).toBe(0);
    expect(m.poor_care_count).toBe(0);
    expect(m.animal_welfare_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts neglectful, poor, negative impact, and not involved correctly", () => {
    const records = [
      makeRecord({ id: "1", care_quality: "neglectful", responsibility_level: "not_involved", therapeutic_impact: "negative" }),
      makeRecord({ id: "2", care_quality: "poor" }),
      makeRecord({ id: "3", care_quality: "good" }),
    ];
    const m = computePetCareMetrics(records);
    expect(m.neglectful_count).toBe(1);
    expect(m.not_involved_count).toBe(1);
    expect(m.negative_impact_count).toBe(1);
    expect(m.poor_care_count).toBe(2); // poor + neglectful
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", animal_welfare_met: true, risk_assessment_done: true }),
      makeRecord({ id: "2", animal_welfare_met: false, risk_assessment_done: false }),
    ];
    const m = computePetCareMetrics(records);
    expect(m.animal_welfare_rate).toBe(50);
    expect(m.risk_assessment_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePetCareMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", pet_type: "dog", care_quality: "good", responsibility_level: "shared_responsibility", therapeutic_impact: "positive" }),
      makeRecord({ id: "2", pet_type: "cat", care_quality: "excellent", responsibility_level: "fully_responsible", therapeutic_impact: "very_positive" }),
    ];
    const m = computePetCareMetrics(records);
    expect(m.by_pet_type).toEqual({ dog: 1, cat: 1 });
    expect(m.by_care_quality).toEqual({ good: 1, excellent: 1 });
    expect(m.by_responsibility_level).toEqual({ shared_responsibility: 1, fully_responsible: 1 });
    expect(m.by_therapeutic_impact).toEqual({ positive: 1, very_positive: 1 });
  });
});

// -- identifyPetCareAlerts ----------------------------------------------------

describe("identifyPetCareAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPetCareAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    expect(identifyPetCareAlerts([makeRecord()])).toEqual([]);
  });

  it("fires neglectful_negative critical alert per-record", () => {
    const records = [
      makeRecord({ care_quality: "neglectful", therapeutic_impact: "negative", child_name: "Alex" }),
    ];
    const alerts = identifyPetCareAlerts(records);
    expect(alerts.some((a) => a.type === "neglectful_negative" && a.severity === "critical")).toBe(true);
  });

  it("fires no_animal_welfare alert when >= 1 animal welfare not met", () => {
    const records = [makeRecord({ animal_welfare_met: false })];
    const alerts = identifyPetCareAlerts(records);
    expect(alerts.some((a) => a.type === "no_animal_welfare" && a.severity === "high")).toBe(true);
  });

  it("fires no_risk_assessment alert when >= 1 risk assessment not done", () => {
    const records = [makeRecord({ risk_assessment_done: false })];
    const alerts = identifyPetCareAlerts(records);
    expect(alerts.some((a) => a.type === "no_risk_assessment" && a.severity === "high")).toBe(true);
  });

  it("fires no_child_choice medium alert only when >= 2 sessions", () => {
    const one = [makeRecord({ child_chose_interaction: false })];
    expect(identifyPetCareAlerts(one).some((a) => a.type === "no_child_choice")).toBe(false);

    const two = [
      makeRecord({ id: "1", child_chose_interaction: false }),
      makeRecord({ id: "2", child_chose_interaction: false }),
    ];
    expect(identifyPetCareAlerts(two).some((a) => a.type === "no_child_choice" && a.severity === "medium")).toBe(true);
  });

  it("fires no_hygiene medium alert only when >= 2 sessions", () => {
    const one = [makeRecord({ hygiene_maintained: false })];
    expect(identifyPetCareAlerts(one).some((a) => a.type === "no_hygiene")).toBe(false);

    const two = [
      makeRecord({ id: "1", hygiene_maintained: false }),
      makeRecord({ id: "2", hygiene_maintained: false }),
    ];
    expect(identifyPetCareAlerts(two).some((a) => a.type === "no_hygiene" && a.severity === "medium")).toBe(true);
  });
});
