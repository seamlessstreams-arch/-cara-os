import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateImmigrationLegalSupport,
  generateCaraInsights,
  type ImmigrationLegalSupportRow,
} from "./immigration-legal-support-service";

function makeRow(overrides: Partial<ImmigrationLegalSupportRow> = {}): ImmigrationLegalSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2026-05-01",
    worker_name: "Worker A",
    record_type: "Status Update",
    current_immigration_status: "Refugee Status",
    legal_representation: true,
    solicitor_firm: "Law Firm A",
    legal_aid_funded: true,
    interpreter_required: false,
    interpreter_language: null,
    deadline_date: null,
    action_required: null,
    outcome: null,
    social_worker_informed: true,
    personal_adviser_involved: true,
    emotional_support_provided: true,
    next_appointment_date: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics (immigration)", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.legal_representation_rate).toBe(0);
    expect(m.active_cases).toBe(0);
    expect(m.pending_decisions).toBe(0);
    expect(m.precarious_status_count).toBe(0);
    expect(m.settled_status_count).toBe(0);
  });

  it("counts correctly for populated data", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Child A", record_type: "Appeal Hearing", current_immigration_status: "Asylum Seeker", status: "Active", legal_representation: false }),
      makeRow({ id: "r2", child_name: "Child B", record_type: "Status Update", current_immigration_status: "British Citizen", status: "Resolved" }),
      makeRow({ id: "r3", child_name: "Child A", record_date: "2026-05-10", record_type: "Tribunal", current_immigration_status: "Asylum Seeker", status: "Awaiting Decision", interpreter_required: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
    // legal_representation: 2/3
    expect(m.legal_representation_rate).toBe(66.7);
    // active_cases: Active + Escalated = 1
    expect(m.active_cases).toBe(1);
    expect(m.pending_decisions).toBe(1);
    // urgent records: Appeal Hearing + Tribunal = 2
    expect(m.urgent_record_count).toBe(2);
    // latest by child: Child A -> r3 (Asylum Seeker = precarious), Child B -> British Citizen (settled)
    expect(m.precarious_status_count).toBe(1);
    expect(m.settled_status_count).toBe(1);
    // interpreter rate: 1/3
    expect(m.interpreter_rate).toBe(33.3);
  });
});

describe("computeAlerts (immigration)", () => {
  it("returns empty for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical no_legal_representation_proceedings for Appeal Hearing without legal rep", () => {
    const rows = [makeRow({ record_type: "Appeal Hearing", legal_representation: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_legal_representation_proceedings");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical missed_deadline when deadline is in the past", () => {
    const rows = [makeRow({ deadline_date: "2020-01-01", status: "Active" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "missed_deadline");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical undocumented_no_active_support for undocumented child without active case", () => {
    const rows = [makeRow({ current_immigration_status: "Undocumented", status: "Resolved" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "undocumented_no_active_support");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("does NOT fire undocumented_no_active_support when status is Active", () => {
    const rows = [makeRow({ current_immigration_status: "Undocumented", status: "Active" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "undocumented_no_active_support")).toBeUndefined();
  });

  it("fires critical age_disputed for age-disputed child", () => {
    const rows = [makeRow({ current_immigration_status: "Age Disputed" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "age_disputed")!.severity).toBe("critical");
  });

  it("fires high no_emotional_support_precarious for precarious status without emotional support", () => {
    const rows = [makeRow({ current_immigration_status: "Asylum Seeker", emotional_support_provided: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_emotional_support_precarious");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high social_worker_not_informed_urgent for urgent record types without SW notification", () => {
    const rows = [makeRow({ record_type: "Emergency Legal Support", social_worker_informed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "social_worker_not_informed_urgent");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high time_limited_no_deadline for time-limited leave without deadline", () => {
    const rows = [makeRow({ current_immigration_status: "Limited Leave to Remain", deadline_date: null, status: "Active" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "time_limited_no_deadline");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });
});

describe("validateImmigrationLegalSupport", () => {
  it("returns valid for correct input", () => {
    const result = validateImmigrationLegalSupport({
      childName: "Child A",
      recordDate: "2026-05-01",
      workerName: "Worker A",
      recordType: "Status Update",
    });
    expect(result.valid).toBe(true);
  });

  it("returns errors for missing required fields", () => {
    const result = validateImmigrationLegalSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error for legal proceedings without legal representation", () => {
    const result = validateImmigrationLegalSupport({
      childName: "Child A",
      recordDate: "2026-05-01",
      workerName: "Worker A",
      recordType: "Appeal Hearing",
      legalRepresentation: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("legal representation"))).toBe(true);
  });

  it("returns error when interpreter required but no language specified", () => {
    const result = validateImmigrationLegalSupport({
      childName: "Child A",
      recordDate: "2026-05-01",
      workerName: "Worker A",
      recordType: "Status Update",
      interpreterRequired: true,
      interpreterLanguage: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Interpreter language"))).toBe(true);
  });
});

describe("generateCaraInsights (immigration)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns insights with correct tags", () => {
    const rows = [makeRow({ record_type: "Appeal Hearing", legal_representation: false, current_immigration_status: "Asylum Seeker" })];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
