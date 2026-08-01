import { describe, it, expect } from "vitest";
import {
  computeChildDigitalWellbeingMetrics,
  identifyChildDigitalWellbeingAlerts,
  type ChildDigitalWellbeingRecord,
} from "./child-digital-wellbeing-service";

function makeRecord(overrides: Partial<ChildDigitalWellbeingRecord> = {}): ChildDigitalWellbeingRecord {
  return {
    id: "dig-1",
    home_id: "home-1",
    device_type: "smartphone",
    online_safety_rating: "good",
    screen_time_compliance: "within_guidelines",
    digital_literacy_level: "competent",
    assessment_date: "2026-04-01",
    child_name: "Oliver Ward",
    child_id: "child-1",
    assessed_by: "Staff A",
    parental_controls_active: true,
    age_appropriate_content: true,
    online_safety_educated: true,
    cyberbullying_screened: true,
    social_media_monitored: true,
    gaming_monitored: true,
    privacy_settings_reviewed: true,
    digital_agreement_signed: true,
    care_plan_reflects: true,
    screen_time_discussed: true,
    sleep_impact_assessed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeChildDigitalWellbeingMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeChildDigitalWellbeingMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_safety_count).toBe(0);
    expect(m.unsafe_safety_count).toBe(0);
    expect(m.excessive_screen_count).toBe(0);
    expect(m.not_monitored_count).toBe(0);
    expect(m.parental_controls_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts safety and screen time issues", () => {
    const records = [
      makeRecord({ id: "1", online_safety_rating: "poor", screen_time_compliance: "excessive" }),
      makeRecord({ id: "2", online_safety_rating: "unsafe", screen_time_compliance: "not_monitored" }),
      makeRecord({ id: "3", online_safety_rating: "good", screen_time_compliance: "within_guidelines" }),
    ];
    const m = computeChildDigitalWellbeingMetrics(records);
    expect(m.poor_safety_count).toBe(1);
    expect(m.unsafe_safety_count).toBe(1);
    expect(m.excessive_screen_count).toBe(1);
    expect(m.not_monitored_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const records = [
      makeRecord({ id: "1", parental_controls_active: true, cyberbullying_screened: true }),
      makeRecord({ id: "2", parental_controls_active: false, cyberbullying_screened: false }),
    ];
    const m = computeChildDigitalWellbeingMetrics(records);
    expect(m.parental_controls_rate).toBe(50);
    expect(m.cyberbullying_screened_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", device_type: "smartphone" }),
      makeRecord({ id: "2", device_type: "smartphone" }),
      makeRecord({ id: "3", device_type: "tablet" }),
    ];
    const m = computeChildDigitalWellbeingMetrics(records);
    expect(m.by_device_type["smartphone"]).toBe(2);
    expect(m.by_device_type["tablet"]).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Oliver" }),
      makeRecord({ id: "2", child_name: "Oliver" }),
      makeRecord({ id: "3", child_name: "Emma" }),
    ];
    const m = computeChildDigitalWellbeingMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

describe("identifyChildDigitalWellbeingAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyChildDigitalWellbeingAlerts([])).toEqual([]);
  });

  it("fires critical alert for unsafe with no parental controls", () => {
    const records = [makeRecord({ online_safety_rating: "unsafe", parental_controls_active: false })];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    const unc = alerts.filter((a) => a.type === "unsafe_no_controls");
    expect(unc.length).toBe(1);
    expect(unc[0].severity).toBe("critical");
  });

  it("does NOT fire unsafe_no_controls if parental controls active", () => {
    const records = [makeRecord({ online_safety_rating: "unsafe", parental_controls_active: true })];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    expect(alerts.filter((a) => a.type === "unsafe_no_controls").length).toBe(0);
  });

  it("fires high alert for cyberbullying not screened >= 1", () => {
    const records = [makeRecord({ cyberbullying_screened: false })];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    const cns = alerts.filter((a) => a.type === "cyberbullying_not_screened");
    expect(cns.length).toBe(1);
    expect(cns[0].severity).toBe("high");
  });

  it("fires high alert for online safety not educated >= 1", () => {
    const records = [makeRecord({ online_safety_educated: false })];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    const one = alerts.filter((a) => a.type === "online_safety_not_educated");
    expect(one.length).toBe(1);
    expect(one[0].severity).toBe("high");
  });

  it("fires medium alert for social media not monitored >= 2", () => {
    const records = [
      makeRecord({ id: "1", social_media_monitored: false }),
      makeRecord({ id: "2", social_media_monitored: false }),
    ];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    const smn = alerts.filter((a) => a.type === "social_media_not_monitored");
    expect(smn.length).toBe(1);
    expect(smn[0].severity).toBe("medium");
  });

  it("does NOT fire social_media_not_monitored for only 1 record", () => {
    const records = [makeRecord({ social_media_monitored: false })];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    expect(alerts.filter((a) => a.type === "social_media_not_monitored").length).toBe(0);
  });

  it("fires medium alert for sleep impact not assessed >= 2", () => {
    const records = [
      makeRecord({ id: "1", sleep_impact_assessed: false }),
      makeRecord({ id: "2", sleep_impact_assessed: false }),
    ];
    const alerts = identifyChildDigitalWellbeingAlerts(records);
    const sia = alerts.filter((a) => a.type === "sleep_impact_not_assessed");
    expect(sia.length).toBe(1);
    expect(sia[0].severity).toBe("medium");
  });
});
