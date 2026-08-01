import { describe, it, expect } from "vitest";
import {
  computeLanguageMetrics,
  identifyLanguageAlerts,
  type LanguageRecord,
} from "./language-communication-service";

function makeRecord(overrides: Partial<LanguageRecord> = {}): LanguageRecord {
  return {
    id: "lc-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    first_language: "English",
    additional_languages: [],
    communication_need: "speech_language_delay",
    support_type: "speech_therapy",
    support_status: "in_place",
    progress_rating: "good",
    communication_passport_in_place: true,
    interpreter_required: false,
    interpreter_arranged: false,
    specialist_involved: true,
    specialist_name: "SLT Smith",
    staff_aware: true,
    staff_trained: true,
    child_views_captured: true,
    reasonable_adjustments: ["visual schedule"],
    review_date: null,
    last_assessment_date: "2026-04-01",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeLanguageMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLanguageMetrics([], 4);
    expect(m.total_records).toBe(0);
    expect(m.children_with_needs).toBe(0);
    expect(m.needs_coverage).toBe(0);
    expect(m.passport_in_place_rate).toBeNull();
    expect(m.interpreter_required_count).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", support_status: "in_place", interpreter_required: true, interpreter_arranged: true, progress_rating: "excellent" }),
      makeRecord({ id: "2", child_id: "c2", support_status: "requested", interpreter_required: true, interpreter_arranged: false, communication_passport_in_place: false, progress_rating: "needs_improvement" }),
      makeRecord({ id: "3", child_id: "c3", support_status: "awaiting_assessment", staff_trained: false, child_views_captured: false }),
    ];
    const m = computeLanguageMetrics(records, 4);
    expect(m.total_records).toBe(3);
    expect(m.children_with_needs).toBe(3);
    // 3 out of 4 children = 75%
    expect(m.needs_coverage).toBe(75);
    expect(m.support_in_place_count).toBe(1);
    expect(m.support_requested_count).toBe(1);
    expect(m.awaiting_assessment_count).toBe(1);
    expect(m.interpreter_required_count).toBe(2);
    // interpreter_arranged: 1 out of 2 required = 50%
    expect(m.interpreter_arranged_rate).toBe(50);
    // passport_in_place: 2 out of 3 = 66.7%
    expect(m.passport_in_place_rate).toBe(66.7);
    expect(m.excellent_progress_count).toBe(1);
    expect(m.needs_improvement_count).toBe(1);
    // staff_trained: 2 out of 3 = 66.7%
    expect(m.staff_trained_rate).toBe(66.7);
    // child_views: 2 out of 3 = 66.7%
    expect(m.child_views_rate).toBe(66.7);
  });

  it("computes average adjustments per child correctly", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", reasonable_adjustments: ["a", "b"] }),
      makeRecord({ id: "2", child_id: "c2", reasonable_adjustments: ["c"] }),
    ];
    const m = computeLanguageMetrics(records, 4);
    // 3 adjustments / 2 unique children = 1.5
    expect(m.average_adjustments_per_child).toBe(1.5);
  });
});

describe("identifyLanguageAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyLanguageAlerts([], 4)).toEqual([]);
  });

  it("triggers interpreter_not_arranged alert (critical)", () => {
    const records = [
      makeRecord({ id: "a1", interpreter_required: true, interpreter_arranged: false, child_name: "Amir", first_language: "Arabic" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "interpreter_not_arranged");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers awaiting_assessment alert when >= 2 awaiting (high)", () => {
    const records = [
      makeRecord({ id: "1", support_status: "awaiting_assessment" }),
      makeRecord({ id: "2", support_status: "awaiting_assessment" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "awaiting_assessment");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does not trigger awaiting_assessment when only 1", () => {
    const records = [
      makeRecord({ id: "1", support_status: "awaiting_assessment" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "awaiting_assessment");
    expect(found).toBeUndefined();
  });

  it("triggers staff_not_trained when support in place but staff not trained (high)", () => {
    const records = [
      makeRecord({ id: "a2", staff_trained: false, support_status: "in_place", child_name: "Bob" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "staff_not_trained");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers needs_specialist when progress needs improvement without specialist (medium)", () => {
    const records = [
      makeRecord({ id: "a3", progress_rating: "needs_improvement", specialist_involved: false, child_name: "Charlie" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "needs_specialist");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers child_views_missing when >= 3 without views (medium)", () => {
    const records = [
      makeRecord({ id: "1", child_views_captured: false, support_status: "in_place" }),
      makeRecord({ id: "2", child_views_captured: false, support_status: "in_place" }),
      makeRecord({ id: "3", child_views_captured: false, support_status: "in_place" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "child_views_missing");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does not trigger child_views_missing when only 2 without views", () => {
    const records = [
      makeRecord({ id: "1", child_views_captured: false, support_status: "in_place" }),
      makeRecord({ id: "2", child_views_captured: false, support_status: "in_place" }),
    ];
    const alerts = identifyLanguageAlerts(records, 4);
    const found = alerts.find((a) => a.type === "child_views_missing");
    expect(found).toBeUndefined();
  });
});
