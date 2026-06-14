import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateDigitalWellbeing,
  generateCaraInsights,
  DigitalWellbeingRow,
} from "./digital-wellbeing-service";

function makeRow(overrides: Partial<DigitalWellbeingRow> = {}): DigitalWellbeingRow {
  return {
    id: "dw-1",
    home_id: "home-1",
    child_name: "Alice",
    record_date: "2026-05-21",
    recorded_by: "Staff A",
    record_type: "Social Media Risk Assessment",
    platform_involved: null,
    risk_level: "No Identified Risk",
    age_appropriate_use: true,
    privacy_settings_reviewed: true,
    contact_with_strangers_identified: false,
    harmful_content_exposure: false,
    cyberbullying_identified: false,
    image_sharing_concerns: false,
    excessive_use_identified: false,
    parental_controls_active: true,
    agreed_screen_time_hours: 2,
    actual_screen_time_hours: 1.5,
    action_taken: null,
    education_provided: true,
    child_views_obtained: true,
    social_worker_informed: true,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.stranger_contact_rate).toBe(0);
    expect(m.average_screen_time).toBe(0);
    expect(m.average_risk_score).toBe(0);
  });

  it("calculates correct metrics for populated data", () => {
    const rows = [
      makeRow({ risk_level: "High", contact_with_strangers_identified: true, actual_screen_time_hours: 3 }),
      makeRow({ id: "dw-2", child_name: "Bob", risk_level: "Low", actual_screen_time_hours: 1 }),
      makeRow({ id: "dw-3", risk_level: "Critical", cyberbullying_identified: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.stranger_contact_rate).toBe(33.3);
    expect(m.cyberbullying_rate).toBe(33.3);
    expect(m.high_critical_risk_count).toBe(2);
    // avg screen time: rows with actual: [3, 1, 1.5] = 5.5 / 3 = 1.8
    expect(m.average_screen_time).toBe(1.8);
    // avg risk score: (3+1+4)/3 = 2.7
    expect(m.average_risk_score).toBe(2.7);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("alerts critical for stranger contact", () => {
    const rows = [makeRow({ contact_with_strangers_identified: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "stranger_contact")).toBeDefined();
    expect(alerts.find((a) => a.type === "stranger_contact")!.severity).toBe("critical");
  });

  it("alerts critical for image sharing concerns", () => {
    const rows = [makeRow({ image_sharing_concerns: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "image_sharing_concern")).toBeDefined();
  });

  it("alerts critical for cyberbullying", () => {
    const rows = [makeRow({ cyberbullying_identified: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "cyberbullying")).toBeDefined();
  });

  it("alerts critical for harmful content exposure", () => {
    const rows = [makeRow({ harmful_content_exposure: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "harmful_content")).toBeDefined();
  });

  it("alerts high for excessive screen time (actual > agreed * 1.5)", () => {
    const rows = [makeRow({ agreed_screen_time_hours: 2, actual_screen_time_hours: 4 })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "excessive_screen_time")).toBeDefined();
  });

  it("does not alert excessive screen time when within limit", () => {
    const rows = [makeRow({ agreed_screen_time_hours: 2, actual_screen_time_hours: 2.5 })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "excessive_screen_time")).toBeUndefined();
  });
});

// ── validateDigitalWellbeing ───────────────────────────────────────────

describe("validateDigitalWellbeing", () => {
  it("returns valid for correct input", () => {
    const result = validateDigitalWellbeing({
      childName: "Alice",
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Social Media Risk Assessment",
      riskLevel: "Low",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const result = validateDigitalWellbeing({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("requires social worker informed when stranger contact identified", () => {
    const result = validateDigitalWellbeing({
      childName: "Alice",
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Social Media Risk Assessment",
      contactWithStrangersIdentified: true,
      socialWorkerInformed: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Social worker must be informed"))).toBe(true);
  });

  it("requires action taken for harmful content or cyberbullying", () => {
    const result = validateDigitalWellbeing({
      childName: "Alice",
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Online Bullying Response",
      cyberbullyingIdentified: true,
      actionTaken: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Action taken must be recorded"))).toBe(true);
  });

  it("rejects negative screen time hours", () => {
    const result = validateDigitalWellbeing({
      childName: "Alice",
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Screen Time Review",
      agreedScreenTimeHours: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cannot be negative"))).toBe(true);
  });

  it("requires action for High/Critical risk level", () => {
    const result = validateDigitalWellbeing({
      childName: "Alice",
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Social Media Risk Assessment",
      riskLevel: "High",
      actionTaken: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Risk level is High"))).toBe(true);
  });
});

// ── generateCaraInsights ───────────────────────────────────────────────

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow()];
    const insights = generateCaraInsights(rows);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[sky]");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights.length).toBe(3);
  });
});
