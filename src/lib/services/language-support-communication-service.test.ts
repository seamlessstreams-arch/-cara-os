import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateLanguageSupport,
  generateCaraInsights,
  type LanguageSupportRow,
} from "./language-support-communication-service";

function makeRow(overrides: Partial<LanguageSupportRow> = {}): LanguageSupportRow {
  return {
    id: "ls-1",
    home_id: "home-1",
    child_name: "Alice",
    assessment_date: "2026-05-01",
    assessor_name: "Assessor A",
    support_type: "Speech and Language Therapy",
    primary_language: "English",
    english_proficiency: "Fluent",
    communication_needs_level: "Medium",
    specialist_assessment_completed: true,
    speech_therapist_involved: true,
    interpreter_regularly_used: false,
    interpreter_language: null,
    communication_tools_in_place: true,
    staff_trained: true,
    individual_communication_plan: true,
    child_views_accessible: true,
    school_aware: true,
    social_worker_informed: true,
    review_date: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.specialist_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.active_needs_count).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", status: "Active", specialist_assessment_completed: true, staff_trained: true }),
      makeRow({ id: "2", child_name: "Bob", status: "Active", specialist_assessment_completed: false, staff_trained: false, support_type: "Interpreter Services", english_proficiency: "No English" }),
      makeRow({ id: "3", child_name: "Alice", status: "Archived", specialist_assessment_completed: true, speech_therapist_involved: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.active_needs_count).toBe(2);
    // specialist_rate: 2/3 = 66.7%
    expect(m.specialist_rate).toBe(66.7);
    // staff_training_rate: 2/3 = 66.7%
    expect(m.staff_training_rate).toBe(66.7);
    expect(m.by_support_type["Speech and Language Therapy"]).toBe(2);
    expect(m.by_support_type["Interpreter Services"]).toBe(1);
    expect(m.by_english_proficiency["Fluent"]).toBe(2);
    expect(m.by_english_proficiency["No English"]).toBe(1);
  });
});

describe("computeAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("triggers complex_no_plan for Complex needs without individual plan (critical)", () => {
    const rows = [
      makeRow({ id: "a1", communication_needs_level: "Complex", individual_communication_plan: false, status: "Active", child_name: "Alice" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "complex_no_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers views_not_accessible for High needs without accessible views (critical)", () => {
    const rows = [
      makeRow({ id: "a2", communication_needs_level: "High", child_views_accessible: false, status: "Active", child_name: "Bob" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "views_not_accessible");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers no_english_no_support for No English without interpreter or tools (critical)", () => {
    const rows = [
      makeRow({ id: "a3", english_proficiency: "No English", interpreter_regularly_used: false, communication_tools_in_place: false, status: "Active", child_name: "Carlos" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_english_no_support");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers high_needs_no_specialist for High needs without specialist assessment (high)", () => {
    const rows = [
      makeRow({ id: "a4", communication_needs_level: "High", specialist_assessment_completed: false, status: "Active", child_name: "Diana" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "high_needs_no_specialist");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers staff_not_trained for active needs (high)", () => {
    const rows = [
      makeRow({ id: "a5", status: "Active", communication_needs_level: "Medium", staff_trained: false, child_name: "Eve" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "staff_not_trained");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers school_not_aware for active needs where school unaware (high)", () => {
    const rows = [
      makeRow({ id: "a6", status: "Active", communication_needs_level: "Medium", school_aware: false, child_name: "Frank" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "school_not_aware");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers sw_not_informed for High/Complex needs without SW informed (high)", () => {
    const rows = [
      makeRow({ id: "a7", status: "Active", communication_needs_level: "Complex", social_worker_informed: false, child_name: "Grace" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "sw_not_informed");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers interpreter_no_language when interpreter used but language not recorded (medium)", () => {
    const rows = [
      makeRow({ id: "a8", interpreter_regularly_used: true, interpreter_language: null, child_name: "Hassan" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "interpreter_no_language");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("validateLanguageSupport", () => {
  it("passes for valid input", () => {
    const result = validateLanguageSupport({
      childName: "Alice",
      assessmentDate: "2026-05-01",
      assessorName: "Staff A",
      supportType: "Speech and Language Therapy",
      primaryLanguage: "English",
      englishProficiency: "Fluent",
      communicationNeedsLevel: "Medium",
      status: "Active",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when required fields are missing", () => {
    const result = validateLanguageSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it("requires interpreter language when interpreter is regularly used", () => {
    const result = validateLanguageSupport({
      childName: "Alice",
      assessmentDate: "2026-05-01",
      assessorName: "Staff A",
      supportType: "Interpreter Services",
      primaryLanguage: "Arabic",
      englishProficiency: "No English",
      communicationNeedsLevel: "High",
      interpreterRegularlyUsed: true,
      interpreterLanguage: null,
    });
    expect(result.errors).toContain("Interpreter language must be specified when interpreter is regularly used");
  });
});

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [
      makeRow({ id: "1" }),
      makeRow({ id: "2", child_name: "Bob" }),
    ];
    const insights = generateCaraInsights(rows);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
