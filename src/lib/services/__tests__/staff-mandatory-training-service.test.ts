// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MANDATORY TRAINING SERVICE TESTS
// Pure-function unit tests for mandatory training metrics computation and alert
// identification.
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 35 (supervision and training). Schedule 2 — fitness of workers.
//
// Covers: training compliance tracking, expiry detection, competence assessment,
// refresher scheduling, certificate management, and evaluation completion.
//
// SCCIF: Well-Led — "Staff are trained and supported. Leaders ensure training
// is current and fit for purpose."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import { _testing, type StaffMandatoryTrainingRecord } from "../staff-mandatory-training-service";
import { todayStr } from "@/lib/utils";

const { computeMandatoryTrainingMetrics, identifyMandatoryTrainingAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffMandatoryTrainingRecord>): StaffMandatoryTrainingRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    training_category: "first_aid",
    compliance_status: "current",
    training_level: "intermediate",
    delivery_method: "classroom",
    session_date: now.toISOString(),
    staff_name: "Staff A",
    recorded_by: "Manager A",
    training_title: "First Aid at Work",
    provider_name: "St John Ambulance",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    completion_date: "completion_date" in (overrides ?? {}) ? (overrides!.completion_date ?? null) : null,
    expiry_date: "expiry_date" in (overrides ?? {}) ? (overrides!.expiry_date ?? null) : null,
    certificate_reference: "certificate_reference" in (overrides ?? {}) ? (overrides!.certificate_reference ?? null) : null,
    cost: "cost" in (overrides ?? {}) ? (overrides!.cost ?? null) : null,
    staff_feedback: "staff_feedback" in (overrides ?? {}) ? (overrides!.staff_feedback ?? null) : null,
    competence_assessment: "competence_assessment" in (overrides ?? {}) ? (overrides!.competence_assessment ?? null) : null,
    refresher_due: "refresher_due" in (overrides ?? {}) ? (overrides!.refresher_due ?? null) : null,
    manager_notes: "manager_notes" in (overrides ?? {}) ? (overrides!.manager_notes ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    certificate_held: true,
    competence_assessed: true,
    staff_attended: true,
    learning_objectives_met: true,
    applied_in_practice: true,
    refresher_scheduled: true,
    manager_verified: true,
    cost_approved: true,
    linked_to_development_plan: true,
    accessible_format: true,
    evaluation_completed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ── computeMandatoryTrainingMetrics ────────────────────────────────────────

describe("computeMandatoryTrainingMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeMandatoryTrainingMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.expiring_soon_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.current_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeMandatoryTrainingMetrics([]);
    expect(m.by_training_category).toEqual({});
    expect(m.by_compliance_status).toEqual({});
    expect(m.by_training_level).toEqual({});
    expect(m.by_delivery_method).toEqual({});
  });

  it("total_records counts records", () => { expect(computeMandatoryTrainingMetrics([makeRecord(), makeRecord({ id: "a-2" }), makeRecord({ id: "a-3" })]).total_records).toBe(3); });

  it("counts expired", () => { expect(computeMandatoryTrainingMetrics([makeRecord({ compliance_status: "expired" })]).expired_count).toBe(1); });

  it("counts expiring_soon", () => { expect(computeMandatoryTrainingMetrics([makeRecord({ compliance_status: "expiring_soon" })]).expiring_soon_count).toBe(1); });

  it("counts not_started", () => { expect(computeMandatoryTrainingMetrics([makeRecord({ compliance_status: "not_started" })]).not_started_count).toBe(1); });

  it("counts current", () => { expect(computeMandatoryTrainingMetrics([makeRecord({ compliance_status: "current" })]).current_count).toBe(1); });

  it("does not count booked as expired", () => { const m = computeMandatoryTrainingMetrics([makeRecord({ compliance_status: "booked" })]); expect(m.expired_count).toBe(0); expect(m.current_count).toBe(0); });

  it("returns 100% boolean rates with defaults", () => { 
    const m = computeMandatoryTrainingMetrics([makeRecord()]);
    expect(m.certificate_held_rate).toBe(100);
    expect(m.competence_assessed_rate).toBe(100);
    expect(m.staff_attended_rate).toBe(100);
    expect(m.learning_objectives_rate).toBe(100);
    expect(m.applied_in_practice_rate).toBe(100);
    expect(m.refresher_scheduled_rate).toBe(100);
    expect(m.manager_verified_rate).toBe(100);
    expect(m.cost_approved_rate).toBe(100);
    expect(m.development_plan_rate).toBe(100);
    expect(m.accessible_format_rate).toBe(100);
    expect(m.evaluation_completed_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("certificate_held_rate 0 when false", () => { expect(computeMandatoryTrainingMetrics([makeRecord({ certificate_held: false })]).certificate_held_rate).toBe(0); });

  it("mixed boolean rate", () => { const recs = [makeRecord({ id: "a-1", competence_assessed: true }), makeRecord({ id: "a-2", competence_assessed: true }), makeRecord({ id: "a-3", competence_assessed: false })]; expect(computeMandatoryTrainingMetrics(recs).competence_assessed_rate).toBe(66.7); });

  it("unique_staff distinct", () => { const recs = [makeRecord({ id: "a-1", staff_name: "Staff A" }), makeRecord({ id: "a-2", staff_name: "Staff B" }), makeRecord({ id: "a-3", staff_name: "Staff A" })]; expect(computeMandatoryTrainingMetrics(recs).unique_staff).toBe(2); });

  it("counts all 10 training categories", () => { const cats = ["safeguarding_level_3", "first_aid", "fire_safety", "medication_administration", "physical_intervention", "food_hygiene", "data_protection", "health_and_safety", "equality_diversity", "other"] as const; const recs = cats.map((c, i) => makeRecord({ id: `a-${i}`, training_category: c })); const m = computeMandatoryTrainingMetrics(recs); for (const c of cats) expect(m.by_training_category[c]).toBe(1); });

  it("counts all 5 compliance statuses", () => { const stats = ["current", "expiring_soon", "expired", "not_started", "booked"] as const; const recs = stats.map((s, i) => makeRecord({ id: `a-${i}`, compliance_status: s })); const m = computeMandatoryTrainingMetrics(recs); for (const s of stats) expect(m.by_compliance_status[s]).toBe(1); });

  it("counts all 5 training levels", () => { const lvls = ["awareness", "foundation", "intermediate", "advanced", "specialist"] as const; const recs = lvls.map((l, i) => makeRecord({ id: `a-${i}`, training_level: l })); const m = computeMandatoryTrainingMetrics(recs); for (const l of lvls) expect(m.by_training_level[l]).toBe(1); });

  it("counts all 10 delivery methods", () => { const mths = ["classroom", "e_learning", "blended", "workplace", "external_provider", "conference", "shadowing", "self_directed", "coaching", "other"] as const; const recs = mths.map((d, i) => makeRecord({ id: `a-${i}`, delivery_method: d })); const m = computeMandatoryTrainingMetrics(recs); for (const d of mths) expect(m.by_delivery_method[d]).toBe(1); });
});

// ── identifyMandatoryTrainingAlerts ────────────────────────────────────────

describe("identifyMandatoryTrainingAlerts", () => {
  it("returns empty for clean", () => { expect(identifyMandatoryTrainingAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyMandatoryTrainingAlerts([])).toEqual([]); });

  it("fires expired_critical_training for expired safeguarding_level_3", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ compliance_status: "expired", training_category: "safeguarding_level_3", staff_name: "Jane D" })]); const c = a.filter((x) => x.type === "expired_critical_training" && x.severity === "critical"); expect(c.length).toBeGreaterThanOrEqual(1); expect(c[0].message).toContain("Jane D"); });

  it("fires for expired first_aid", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ compliance_status: "expired", training_category: "first_aid" })]); expect(a.filter((x) => x.type === "expired_critical_training" && x.severity === "critical").length).toBeGreaterThanOrEqual(1); });

  it("fires for expired physical_intervention", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ compliance_status: "expired", training_category: "physical_intervention" })]); expect(a.filter((x) => x.type === "expired_critical_training" && x.severity === "critical").length).toBeGreaterThanOrEqual(1); });

  it("no critical for expired food_hygiene", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ compliance_status: "expired", training_category: "food_hygiene" })]); expect(a.filter((x) => x.type === "expired_critical_training" && x.severity === "critical").length).toBe(0); });

  it("per-record", () => { const recs = [makeRecord({ id: "a-1", compliance_status: "expired", training_category: "safeguarding_level_3" }), makeRecord({ id: "a-2", compliance_status: "expired", training_category: "safeguarding_level_3" })]; const a = identifyMandatoryTrainingAlerts(recs); expect(a.filter((x) => x.type === "expired_critical_training" && x.severity === "critical").length).toBe(2); });

  it("fires expired_training", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ compliance_status: "expired" })]); expect(a.filter((x) => x.type === "expired_training" && x.severity === "high").length).toBeGreaterThanOrEqual(1); });

  it("fires no_competence_assessed", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ competence_assessed: false })]); expect(a.filter((x) => x.type === "no_competence_assessed" && x.severity === "high").length).toBeGreaterThanOrEqual(1); });

  it("no_refresher_scheduled not for 1", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ refresher_scheduled: false })]); expect(a.filter((x) => x.type === "no_refresher_scheduled").length).toBe(0); });

  it("no_refresher_scheduled fires for 2", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ id: "a-1", refresher_scheduled: false }), makeRecord({ id: "a-2", refresher_scheduled: false })]); expect(a.filter((x) => x.type === "no_refresher_scheduled" && x.severity === "medium").length).toBeGreaterThanOrEqual(1); });

  it("no_evaluation not for 1", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ evaluation_completed: false })]); expect(a.filter((x) => x.type === "no_evaluation").length).toBe(0); });

  it("no_evaluation fires for 2", () => { const a = identifyMandatoryTrainingAlerts([makeRecord({ id: "a-1", evaluation_completed: false }), makeRecord({ id: "a-2", evaluation_completed: false })]); expect(a.filter((x) => x.type === "no_evaluation" && x.severity === "medium").length).toBeGreaterThanOrEqual(1); });

  it("fires all applicable", () => { 
    const recs = [makeRecord({ id: "a-1", compliance_status: "expired", training_category: "safeguarding_level_3", competence_assessed: false, refresher_scheduled: false, evaluation_completed: false }), makeRecord({ id: "a-2", compliance_status: "expired", training_category: "first_aid", competence_assessed: false, refresher_scheduled: false, evaluation_completed: false })];
    const a = identifyMandatoryTrainingAlerts(recs);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("expired_critical_training")).toBe(true);
    expect(types.has("expired_training")).toBe(true);
    expect(types.has("no_competence_assessed")).toBe(true);
    expect(types.has("no_refresher_scheduled")).toBe(true);
    expect(types.has("no_evaluation")).toBe(true);
  });
});
