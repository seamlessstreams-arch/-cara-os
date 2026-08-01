import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateOutdoorAdventureActivity,
} from "./outdoor-adventure-activities-service";
import type { OutdoorAdventureActivityRow } from "./outdoor-adventure-activities-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<OutdoorAdventureActivityRow> = {}): OutdoorAdventureActivityRow {
  return {
    id: "oaa-1",
    home_id: "home-1",
    child_name: "Alex",
    activity_date: "2026-05-10",
    lead_staff: "Staff A",
    activity_type: "Walking/Hiking",
    risk_assessment_completed: true,
    parental_consent: true,
    aala_licence_checked: null,
    instructor_qualified: true,
    first_aider_present: true,
    ratio_adequate: true,
    weather_appropriate: true,
    equipment_checked: true,
    young_person_choice: true,
    engagement_level: "Engaged",
    physical_benefit: true,
    emotional_benefit: true,
    social_benefit: true,
    confidence_building: true,
    achievement_noted: null,
    injury_occurred: false,
    injury_details: null,
    linked_to_care_plan: true,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_activities).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.risk_assessment_rate).toBeNull();;
    expect(m.consent_rate).toBeNull();;
    expect(m.injury_rate).toBeNull();;
    expect(m.achievement_count).toBe(0);
    expect(m.average_engagement).toBe(0);
    expect(m.high_risk_activity_count).toBe(0);
    expect(m.water_activity_count).toBe(0);
  });

  it("counts unique children case-insensitively", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "alex" }),
      makeRow({ id: "3", child_name: "Beth" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("calculates boolean rates correctly (100% when all true)", () => {
    const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
    const m = computeMetrics(rows);
    expect(m.risk_assessment_rate).toBe(100);
    expect(m.consent_rate).toBe(100);
    expect(m.first_aid_rate).toBe(100);
    expect(m.child_choice_rate).toBe(100);
    expect(m.injury_rate).toBe(0);
  });

  it("calculates rates at 50% when half true", () => {
    const rows = [
      makeRow({ id: "1", risk_assessment_completed: true }),
      makeRow({ id: "2", risk_assessment_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.risk_assessment_rate).toBe(50);
  });

  it("counts high-risk and water activities", () => {
    const rows = [
      makeRow({ id: "1", activity_type: "Climbing/Bouldering" }),
      makeRow({ id: "2", activity_type: "Kayaking/Canoeing" }),
      makeRow({ id: "3", activity_type: "Swimming" }),
      makeRow({ id: "4", activity_type: "Walking/Hiking" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_activity_count).toBe(2); // Climbing, Kayaking
    expect(m.water_activity_count).toBe(2); // Kayaking, Swimming
  });

  it("calculates average engagement numeric", () => {
    // Engaged = 4, Enthusiastic = 5 => avg = 4.5
    const rows = [
      makeRow({ id: "1", engagement_level: "Engaged" }),
      makeRow({ id: "2", engagement_level: "Enthusiastic" }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_engagement).toBe(4.5);
  });

  it("counts DofE sessions and achievements", () => {
    const rows = [
      makeRow({ id: "1", activity_type: "Duke of Edinburgh", achievement_noted: "Bronze completed" }),
      makeRow({ id: "2", activity_type: "Duke of Edinburgh" }),
      makeRow({ id: "3", achievement_noted: "Personal best" }),
    ];
    const m = computeMetrics(rows);
    expect(m.dofe_count).toBe(2);
    expect(m.achievement_count).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty array when no issues", () => {
    const rows = [makeRow()];
    const alerts = computeAlerts(rows);
    expect(alerts).toEqual([]);
  });

  it("flags critical no_risk_assessment alert", () => {
    const rows = [makeRow({ risk_assessment_completed: false })];
    const alerts = computeAlerts(rows);
    const ra = alerts.filter((a) => a.type === "no_risk_assessment");
    expect(ra.length).toBe(1);
    expect(ra[0].severity).toBe("critical");
  });

  it("flags critical aala_licence_not_checked for licensable activity", () => {
    const rows = [makeRow({ activity_type: "Climbing/Bouldering", aala_licence_checked: false })];
    const alerts = computeAlerts(rows);
    const aala = alerts.filter((a) => a.type === "aala_licence_not_checked");
    expect(aala.length).toBe(1);
    expect(aala[0].severity).toBe("critical");
  });

  it("flags critical injury_occurred alert", () => {
    const rows = [makeRow({ injury_occurred: true, injury_details: "Sprained ankle" })];
    const alerts = computeAlerts(rows);
    const inj = alerts.filter((a) => a.type === "injury_occurred");
    expect(inj.length).toBe(1);
    expect(inj[0].severity).toBe("critical");
  });

  it("flags high repeated_refusal when same child refuses >= 3 times", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", engagement_level: "Refused" }),
      makeRow({ id: "2", child_name: "Alex", engagement_level: "Refused" }),
      makeRow({ id: "3", child_name: "Alex", engagement_level: "Refused" }),
    ];
    const alerts = computeAlerts(rows);
    const refusal = alerts.filter((a) => a.type === "repeated_refusal");
    expect(refusal.length).toBe(1);
    expect(refusal[0].severity).toBe("high");
  });

  it("does not flag repeated_refusal when same child refuses < 3 times", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", engagement_level: "Refused" }),
      makeRow({ id: "2", child_name: "Alex", engagement_level: "Refused" }),
    ];
    const alerts = computeAlerts(rows);
    const refusal = alerts.filter((a) => a.type === "repeated_refusal");
    expect(refusal.length).toBe(0);
  });

  it("flags high multiple_injuries when >= 3 injuries", () => {
    const rows = [
      makeRow({ id: "1", injury_occurred: true, injury_details: "a" }),
      makeRow({ id: "2", injury_occurred: true, injury_details: "b" }),
      makeRow({ id: "3", injury_occurred: true, injury_details: "c" }),
    ];
    const alerts = computeAlerts(rows);
    const multi = alerts.filter((a) => a.type === "multiple_injuries");
    expect(multi.length).toBe(1);
    expect(multi[0].severity).toBe("high");
  });

  it("flags medium low_child_choice when < 40% with >= 5 rows", () => {
    // 1 of 5 = 20% < 40%
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r${i}`, young_person_choice: i === 0 }),
    );
    const alerts = computeAlerts(rows);
    const choice = alerts.filter((a) => a.type === "low_child_choice");
    expect(choice.length).toBe(1);
    expect(choice[0].severity).toBe("medium");
  });
});

// -- validateOutdoorAdventureActivity -----------------------------------------

describe("validateOutdoorAdventureActivity", () => {
  it("returns valid for complete correct input", () => {
    const result = validateOutdoorAdventureActivity({
      childName: "Alex",
      activityDate: "2026-05-10",
      leadStaff: "Staff A",
      activityType: "Walking/Hiking",
      riskAssessmentCompleted: true,
      parentalConsent: true,
      instructorQualified: true,
      firstAiderPresent: true,
      ratioAdequate: true,
      weatherAppropriate: true,
      equipmentChecked: true,
      engagementLevel: "Engaged",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing child name", () => {
    const result = validateOutdoorAdventureActivity({
      childName: "",
      activityDate: "2026-05-10",
      leadStaff: "Staff A",
      activityType: "Walking/Hiking",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
  });

  it("rejects risk assessment not completed", () => {
    const result = validateOutdoorAdventureActivity({
      childName: "Alex",
      activityDate: "2026-05-10",
      leadStaff: "Staff A",
      activityType: "Walking/Hiking",
      riskAssessmentCompleted: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Risk assessment"))).toBe(true);
  });

  it("rejects AALA-licensable activity without licence check", () => {
    const result = validateOutdoorAdventureActivity({
      childName: "Alex",
      activityDate: "2026-05-10",
      leadStaff: "Staff A",
      activityType: "Climbing/Bouldering",
      aalaLicenceChecked: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AALA"))).toBe(true);
  });

  it("requires injury details when injury occurred", () => {
    const result = validateOutdoorAdventureActivity({
      childName: "Alex",
      activityDate: "2026-05-10",
      leadStaff: "Staff A",
      activityType: "Walking/Hiking",
      injuryOccurred: true,
      injuryDetails: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Injury details"))).toBe(true);
  });
});
