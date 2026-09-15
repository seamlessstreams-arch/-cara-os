import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  type OutdoorAdventureActivityRow,
} from "../outdoor-adventure-activities-service";

function makeRecord(
  overrides: Partial<OutdoorAdventureActivityRow> = {},
): OutdoorAdventureActivityRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    activity_date: "2026-05-04",
    lead_staff: "Alex Morgan",
    activity_type: "Walking/Hiking",
    risk_assessment_completed: true,
    parental_consent: true,
    aala_licence_checked: true,
    instructor_qualified: true,
    first_aider_present: true,
    ratio_adequate: true,
    weather_appropriate: true,
    equipment_checked: true,
    young_person_choice: true,
    engagement_level: "Participated",
    physical_benefit: true,
    emotional_benefit: true,
    social_benefit: true,
    confidence_building: true,
    achievement_noted: null,
    injury_occurred: false,
    injury_details: null,
    linked_to_care_plan: true,
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("alerts on an unrecorded risk assessment as a gap, not an asserted failure", () => {
    const nullAlert = computeAlerts([
      makeRecord({ risk_assessment_completed: null }),
    ]).find((a) => a.type === "no_risk_assessment");
    const falseAlert = computeAlerts([
      makeRecord({ risk_assessment_completed: false }),
    ]).find((a) => a.type === "no_risk_assessment");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("does not alert when the risk assessment is recorded as done", () => {
    const alerts = computeAlerts([makeRecord({ risk_assessment_completed: true })]);
    expect(alerts.some((a) => a.type === "no_risk_assessment")).toBe(false);
  });

  it("words an unrecorded AALA check differently from a failed one", () => {
    const nullAlert = computeAlerts([
      makeRecord({ activity_type: "Climbing/Bouldering", aala_licence_checked: null }),
    ]).find((a) => a.type === "aala_licence_not_checked");
    const falseAlert = computeAlerts([
      makeRecord({ activity_type: "Climbing/Bouldering", aala_licence_checked: false }),
    ]).find((a) => a.type === "aala_licence_not_checked");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("words an unrecorded parental consent differently from a recorded refusal", () => {
    const nullAlert = computeAlerts([
      makeRecord({ parental_consent: null }),
    ]).find((a) => a.type === "no_parental_consent");
    const falseAlert = computeAlerts([
      makeRecord({ parental_consent: false }),
    ]).find((a) => a.type === "no_parental_consent");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("does not turn unrecorded child choice into a low-choice verdict", () => {
    const rows = [true, null, null, null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, young_person_choice: v }),
    );
    expect(computeAlerts(rows).some((a) => a.type === "low_child_choice")).toBe(false);
  });

  it("still reports a genuinely low recorded choice rate", () => {
    const rows = [true, false, false, false, false].map((v, i) =>
      makeRecord({ id: `r-${i}`, young_person_choice: v }),
    );
    expect(computeAlerts(rows).some((a) => a.type === "low_child_choice")).toBe(true);
  });

  it("does not count an unrecorded injury as an injury", () => {
    const rows = [null, null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, injury_occurred: v }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "injury_occurred")).toBe(false);
    expect(alerts.some((a) => a.type === "multiple_injuries")).toBe(false);
  });
});
