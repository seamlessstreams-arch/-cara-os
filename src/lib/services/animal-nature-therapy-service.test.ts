import { describe, it, expect } from "vitest";
import { computeMetrics, computeAlerts, validateAnimalNatureTherapy } from "./animal-nature-therapy-service";
import type { AnimalNatureTherapyRow } from "./animal-nature-therapy-service";

function makeRow(overrides: Partial<AnimalNatureTherapyRow> = {}): AnimalNatureTherapyRow {
  return {
    id: "row-1", home_id: "home-1", child_name: "Alex",
    session_date: "2026-05-15", facilitator_name: "Dr Jones",
    therapy_type: "Equine-Assisted Therapy", animal_involved: "Horse",
    qualified_therapist: true, therapy_or_activity: "Registered Therapy",
    risk_assessment_completed: true, allergy_check: true,
    animal_welfare_compliant: true, parental_consent: true,
    child_choice: true, engagement_level: "Engaged",
    emotional_response: "Positive", therapeutic_goal: "Build confidence",
    progress_noted: "Good session", linked_to_care_plan: true,
    injury_occurred: false, injury_details: null, notes: null,
    created_at: "2026-05-15T00:00:00Z", updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeMetrics([]);
    expect(result.total_sessions).toBe(0);
    expect(result.unique_children).toBe(0);
    expect(result.qualified_therapist_rate).toBeNull();;
    expect(result.risk_assessment_rate).toBeNull();;
    expect(result.injury_rate).toBeNull();;
    expect(result.average_sessions_per_child).toBeNull();;
  });

  it("counts total sessions and unique children", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Alex" }),
      makeRow({ id: "r2", child_name: "Alex" }),
      makeRow({ id: "r3", child_name: "Jordan" }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_sessions).toBe(3);
    expect(result.unique_children).toBe(2);
    expect(result.average_sessions_per_child).toBe(1.5);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "r1", qualified_therapist: true, risk_assessment_completed: true, child_choice: true }),
      makeRow({ id: "r2", qualified_therapist: false, risk_assessment_completed: false, child_choice: false }),
    ];
    const result = computeMetrics(rows);
    expect(result.qualified_therapist_rate).toBe(50);
    expect(result.risk_assessment_rate).toBe(50);
    expect(result.child_choice_rate).toBe(50);
  });

  it("computes engagement and positive response rates", () => {
    const rows = [
      makeRow({ id: "r1", engagement_level: "Engaged", emotional_response: "Very Positive" }),
      makeRow({ id: "r2", engagement_level: "Refused", emotional_response: "Negative" }),
      makeRow({ id: "r3", engagement_level: "Participated", emotional_response: "Positive" }),
    ];
    const result = computeMetrics(rows);
    // Positive engagement: Participated + Engaged = 2/3
    expect(result.engagement_rate).toBeCloseTo(66.7, 0);
    // Positive response: Very Positive + Positive = 2/3
    expect(result.positive_response_rate).toBeCloseTo(66.7, 0);
  });

  it("counts therapy vs activity ratio", () => {
    const rows = [
      makeRow({ id: "r1", therapy_or_activity: "Registered Therapy" }),
      makeRow({ id: "r2", therapy_or_activity: "Structured Activity" }),
      makeRow({ id: "r3", therapy_or_activity: "Recreational" }),
      makeRow({ id: "r4", therapy_or_activity: "Educational" }),
    ];
    const result = computeMetrics(rows);
    expect(result.therapy_vs_activity_ratio.therapy).toBe(1);
    expect(result.therapy_vs_activity_ratio.activity).toBe(1);
    expect(result.therapy_vs_activity_ratio.recreational).toBe(1);
    expect(result.therapy_vs_activity_ratio.educational).toBe(1);
  });

  it("counts animal-based and nature-based types", () => {
    const rows = [
      makeRow({ id: "r1", therapy_type: "Equine-Assisted Therapy" }), // animal-based + formal
      makeRow({ id: "r2", therapy_type: "Forest School" }), // nature-based + outdoor
      makeRow({ id: "r3", therapy_type: "Farm Therapy" }), // animal-based
    ];
    const result = computeMetrics(rows);
    expect(result.animal_based_count).toBe(2);
    expect(result.nature_based_count).toBe(1);
    expect(result.formal_therapy_count).toBe(1);
    expect(result.outdoor_count).toBe(1);
  });

  it("groups by therapy type, engagement, emotional response", () => {
    const rows = [
      makeRow({ id: "r1", therapy_type: "Equine-Assisted Therapy", engagement_level: "Engaged", emotional_response: "Positive" }),
    ];
    const result = computeMetrics(rows);
    expect(result.by_therapy_type["Equine-Assisted Therapy"]).toBe(1);
    expect(result.by_engagement_level["Engaged"]).toBe(1);
    expect(result.by_emotional_response["Positive"]).toBe(1);
  });
});

describe("computeAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = computeAlerts([]);
    expect(result).toEqual([]);
  });

  it("flags injury as critical", () => {
    const rows = [makeRow({ id: "r1", injury_occurred: true, injury_details: "Minor scratch" })];
    const result = computeAlerts(rows);
    const alerts = result.filter((a) => a.type === "injury_occurred");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags registered therapy without qualified therapist as critical", () => {
    const rows = [
      makeRow({ id: "r1", therapy_or_activity: "Registered Therapy", qualified_therapist: false }),
    ];
    const result = computeAlerts(rows);
    const alerts = result.filter((a) => a.type === "therapy_no_qualified_therapist");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags animal session without risk assessment as critical", () => {
    const rows = [
      makeRow({ id: "r1", therapy_type: "Equine-Assisted Therapy", risk_assessment_completed: false }),
    ];
    const result = computeAlerts(rows);
    const alerts = result.filter((a) => a.type === "animal_no_risk_assessment");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("returns no alerts for perfect records", () => {
    const rows = [makeRow()];
    const result = computeAlerts(rows);
    expect(result.length).toBe(0);
  });
});

describe("validateAnimalNatureTherapy", () => {
  it("validates good input", () => {
    const result = validateAnimalNatureTherapy({
      childName: "Alex", sessionDate: "2026-05-15",
      facilitatorName: "Dr Jones", therapyType: "Equine-Assisted Therapy",
      therapyOrActivity: "Registered Therapy",
      engagementLevel: "Engaged", emotionalResponse: "Positive",
      qualifiedTherapist: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects missing required fields", () => {
    const result = validateAnimalNatureTherapy({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects future dates", () => {
    const result = validateAnimalNatureTherapy({
      childName: "Alex", sessionDate: "2099-01-01",
      facilitatorName: "Dr Jones", therapyType: "Equine-Assisted Therapy",
      therapyOrActivity: "Registered Therapy",
      engagementLevel: "Engaged", emotionalResponse: "Positive",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });
});
