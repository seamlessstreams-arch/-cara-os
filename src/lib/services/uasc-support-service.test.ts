import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateUascSupport,
  type UascSupportRow,
} from "./uasc-support-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<UascSupportRow> = {}): UascSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2025-01-15",
    worker_name: "Worker A",
    record_type: "Initial Assessment",
    immigration_status: "Asylum Seeker",
    legal_representation: false,
    solicitor_name: overrides.solicitor_name ?? null,
    interpreter_required: false,
    interpreter_language: overrides.interpreter_language ?? null,
    age_assessment_status: "Not Required",
    trafficking_indicators: false,
    nrm_referred: false,
    education_provision: "Mainstream School",
    health_screening_completed: true,
    mental_health_support: false,
    cultural_needs_met: true,
    religious_needs_met: true,
    social_worker_informed: true,
    next_review_date: overrides.next_review_date ?? null,
    status: "Active",
    notes: overrides.notes ?? null,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
      ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.legal_representation_rate).toBeNull();;
    expect(m.interpreter_rate).toBeNull();;
    expect(m.trafficking_rate).toBeNull();;
    expect(m.nrm_rate).toBeNull();;
    expect(m.health_screening_rate).toBeNull();;
    expect(m.camhs_rate).toBeNull();;
    expect(m.cultural_needs_met_rate).toBeNull();;
    expect(m.religious_needs_met_rate).toBeNull();;
    expect(m.age_dispute_count).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.overdue_review_count).toBe(0);
    expect(m.social_worker_informed_rate).toBeNull();;
  });

  it("counts totals, unique children, and active correctly", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", status: "Active" }),
      makeRow({ id: "2", child_name: "Bob", status: "Active" }),
      makeRow({ id: "3", child_name: "Alice", status: "Resolved" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.active_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ legal_representation: true, interpreter_required: true, health_screening_completed: true }),
      makeRow({ legal_representation: false, interpreter_required: false, health_screening_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.legal_representation_rate).toBe(50);
    expect(m.interpreter_rate).toBe(50);
    expect(m.health_screening_rate).toBe(50);
  });

  it("computes record type breakdown", () => {
    const rows = [
      makeRow({ record_type: "Initial Assessment" }),
      makeRow({ record_type: "Initial Assessment" }),
      makeRow({ record_type: "Age Assessment" }),
    ];
    const m = computeMetrics(rows);
    expect(m.by_record_type["Initial Assessment"]).toBe(2);
    expect(m.by_record_type["Age Assessment"]).toBe(1);
  });

  it("computes age dispute count from both dispute types", () => {
    const rows = [
      makeRow({ age_assessment_status: "Disputed — Merton Assessment" }),
      makeRow({ age_assessment_status: "Disputed — Judicial Review" }),
      makeRow({ age_assessment_status: "Accepted" }),
    ];
    const m = computeMetrics(rows);
    expect(m.age_dispute_count).toBe(2);
  });

  it("counts overdue reviews", () => {
    const rows = [
      makeRow({ next_review_date: "2020-01-01" }),
      makeRow({ next_review_date: "2099-12-31" }),
      makeRow({ next_review_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_review_count).toBe(1);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for trafficking without NRM referral (active)", () => {
    const rows = [
      makeRow({ trafficking_indicators: true, nrm_referred: false, status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "trafficking_no_nrm");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire trafficking alert when status is not Active", () => {
    const rows = [
      makeRow({ trafficking_indicators: true, nrm_referred: false, status: "Resolved" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "trafficking_no_nrm")).toBeUndefined();
  });

  it("fires critical alert for refused status without legal rep", () => {
    const rows = [
      makeRow({
        immigration_status: "Refused — Appeal Rights Exhausted",
        legal_representation: false,
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "refused_no_legal");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for age disputed without assessment", () => {
    const rows = [
      makeRow({
        immigration_status: "Age Disputed",
        age_assessment_status: "Not Required",
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "age_disputed_no_assessment");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for asylum seeker without legal rep", () => {
    const rows = [
      makeRow({ immigration_status: "Asylum Seeker", legal_representation: false, status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "asylum_no_legal");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for not in education", () => {
    const rows = [
      makeRow({ education_provision: "Not in Education", status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "not_in_education");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for unmet cultural needs", () => {
    const rows = [
      makeRow({ cultural_needs_met: false, religious_needs_met: true, status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "unmet_cultural_religious");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for awaiting education placement", () => {
    const rows = [
      makeRow({ education_provision: "Awaiting Placement", status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "awaiting_education");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

// ── validateUascSupport ────────────────────────────────────────────────

describe("validateUascSupport", () => {
  it("returns valid for correct minimal input", () => {
    const result = validateUascSupport({
      childName: "Child A",
      recordDate: "2025-01-15",
      workerName: "Worker A",
      recordType: "Initial Assessment",
      immigrationStatus: "Asylum Seeker",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const result = validateUascSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("rejects solicitor appointment without legal representation", () => {
    const result = validateUascSupport({
      childName: "Child A",
      recordDate: "2025-01-15",
      workerName: "Worker A",
      recordType: "Solicitor Appointment",
      immigrationStatus: "Asylum Seeker",
      legalRepresentation: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Legal representation must be marked as true"))).toBe(true);
  });

  it("rejects trafficking indicators without NRM referral", () => {
    const result = validateUascSupport({
      childName: "Child A",
      recordDate: "2025-01-15",
      workerName: "Worker A",
      recordType: "Initial Assessment",
      immigrationStatus: "Asylum Seeker",
      traffickingIndicators: true,
      nrmReferred: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("NRM referral should be considered"))).toBe(true);
  });

  it("rejects interpreter required without language", () => {
    const result = validateUascSupport({
      childName: "Child A",
      recordDate: "2025-01-15",
      workerName: "Worker A",
      recordType: "Initial Assessment",
      immigrationStatus: "Asylum Seeker",
      interpreterRequired: true,
      interpreterLanguage: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Interpreter language must be specified"))).toBe(true);
  });

  it("rejects future record dates", () => {
    const result = validateUascSupport({
      childName: "Child A",
      recordDate: "2099-12-31",
      workerName: "Worker A",
      recordType: "Initial Assessment",
      immigrationStatus: "Asylum Seeker",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });
});
