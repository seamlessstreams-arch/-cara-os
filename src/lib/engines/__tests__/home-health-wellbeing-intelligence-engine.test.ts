// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HEALTH & WELLBEING INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeHealthWellbeing,
  type HomeHealthWellbeingInput,
  type HealthRecordInput,
  type HomeMedicationInput,
  type MedicationAdminInput,
} from "../home-health-wellbeing-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeHealthRecord(overrides: Partial<HealthRecordInput> = {}): HealthRecordInput {
  return {
    id: "hr_1",
    child_id: "yp_alex",
    date: "2026-05-20",
    record_type: "health_assessment",
    status: "current",
    has_outcome: true,
    has_follow_up: true,
    follow_up_overdue: false,
    ...overrides,
  };
}

function makeMedication(overrides: Partial<HomeMedicationInput> = {}): HomeMedicationInput {
  return {
    id: "med_1",
    child_id: "yp_casey",
    is_active: true,
    ...overrides,
  };
}

function makeMedAdmin(overrides: Partial<MedicationAdminInput> = {}): MedicationAdminInput {
  return {
    id: "ma_1",
    child_id: "yp_casey",
    date: "2026-05-20",
    status: "administered",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeHealthWellbeingInput> = {}): HomeHealthWellbeingInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    health_records: [
      makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "health_assessment" }),
      makeHealthRecord({ id: "h2", child_id: "yp_jordan", date: "2026-04-10", record_type: "dental" }),
      makeHealthRecord({ id: "h3", child_id: "yp_casey", date: "2026-03-15", record_type: "mental_health", status: "monitoring" }),
      makeHealthRecord({ id: "h4", child_id: "yp_alex", date: "2026-04-01", record_type: "dental" }),
      makeHealthRecord({ id: "h5", child_id: "yp_jordan", date: "2026-03-01", record_type: "optical" }),
      makeHealthRecord({ id: "h6", child_id: "yp_casey", date: "2026-02-15", record_type: "optical" }),
      makeHealthRecord({ id: "h7", child_id: "yp_jordan", date: "2026-05-10", record_type: "health_assessment" }),
      makeHealthRecord({ id: "h8", child_id: "yp_casey", date: "2026-05-15", record_type: "health_assessment" }),
      makeHealthRecord({ id: "h9", child_id: "yp_alex", date: "2026-03-20", record_type: "optical" }),
    ],
    medications: [
      makeMedication({ id: "m1", child_id: "yp_casey" }),
    ],
    medication_administrations: [
      makeMedAdmin({ id: "a1", date: "2026-05-25" }),
      makeMedAdmin({ id: "a2", date: "2026-05-24" }),
      makeMedAdmin({ id: "a3", date: "2026-05-23" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Health & Wellbeing Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r).toHaveProperty("health_rating");
    expect(r).toHaveProperty("health_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("records");
    expect(r).toHaveProperty("medication");
    expect(r).toHaveProperty("coverage");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.health_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.health_score).toBeGreaterThanOrEqual(0);
    expect(r.health_score).toBeLessThanOrEqual(100);
  });

  it("records profile has correct shape", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.records).toHaveProperty("total_records_180d");
    expect(r.records).toHaveProperty("records_per_child");
    expect(r.records).toHaveProperty("record_types");
    expect(r.records).toHaveProperty("children_with_records");
    expect(r.records).toHaveProperty("children_without_records");
    expect(r.records).toHaveProperty("health_assessments_count");
    expect(r.records).toHaveProperty("mental_health_count");
    expect(r.records).toHaveProperty("follow_up_compliance_rate");
    expect(r.records).toHaveProperty("outcome_rate");
  });

  it("medication profile has correct shape", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.medication).toHaveProperty("active_medications");
    expect(r.medication).toHaveProperty("children_on_medication");
    expect(r.medication).toHaveProperty("administered_rate");
    expect(r.medication).toHaveProperty("refused_count");
    expect(r.medication).toHaveProperty("missed_count");
  });

  it("coverage profile has correct shape", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.coverage).toHaveProperty("dental_coverage");
    expect(r.coverage).toHaveProperty("optical_coverage");
    expect(r.coverage).toHaveProperty("mental_health_monitored");
    expect(r.coverage).toHaveProperty("growth_monitored");
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data with fewer than 2 records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [makeHealthRecord()],
    }));
    expect(r.health_rating).toBe("insufficient_data");
    expect(r.health_score).toBe(0);
  });

  it("returns insufficient_data with zero records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [],
    }));
    expect(r.health_rating).toBe("insufficient_data");
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("has concern about zero records when no records", () => {
    const r = computeHomeHealthWellbeing(baseInput({ health_records: [] }));
    expect(r.concerns.some(c => c.toLowerCase().includes("no health records"))).toBe(true);
  });

  // ── Record Counting ───────────────────────────────────────────────────────

  it("correctly counts 180-day records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20" }),       // 6 days, in
        makeHealthRecord({ id: "h2", date: "2026-01-01" }),       // ~145 days, in
        makeHealthRecord({ id: "h3", date: "2025-10-01" }),       // >180d, out
      ],
    }));
    expect(r.records.total_records_180d).toBe(2);
  });

  it("calculates records per child", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.records.records_per_child).toBe(3); // 9 records / 3 children
  });

  it("counts record types correctly", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.records.record_types["health_assessment"]).toBe(3);
    expect(r.records.record_types["dental"]).toBe(2);
    expect(r.records.record_types["optical"]).toBe(3);
    expect(r.records.record_types["mental_health"]).toBe(1);
  });

  // ── Children Tracking ─────────────────────────────────────────────────────

  it("identifies children with records", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.records.children_with_records).toContain("yp_alex");
    expect(r.records.children_with_records).toContain("yp_jordan");
    expect(r.records.children_with_records).toContain("yp_casey");
    expect(r.records.children_without_records).toEqual([]);
  });

  it("identifies children without records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
    }));
    expect(r.records.children_without_records).toContain("yp_jordan");
    expect(r.records.children_without_records).toContain("yp_casey");
  });

  // ── Follow-up Compliance ──────────────────────────────────────────────────

  it("calculates 100% follow-up compliance when no overdue", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: false }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_follow_up: true, follow_up_overdue: false }),
      ],
    }));
    expect(r.records.follow_up_compliance_rate).toBe(100);
  });

  it("detects reduced follow-up compliance", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: false }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_follow_up: true, follow_up_overdue: true }),
      ],
    }));
    expect(r.records.follow_up_compliance_rate).toBe(50);
  });

  it("counts overdue follow-ups", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h3", date: "2026-03-15", has_follow_up: false }),
      ],
    }));
    expect(r.records.overdue_follow_ups).toBe(2);
  });

  // ── Outcome Documentation ─────────────────────────────────────────────────

  it("calculates outcome rate correctly", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_outcome: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_outcome: true }),
        makeHealthRecord({ id: "h3", date: "2026-03-15", has_outcome: false }),
      ],
    }));
    expect(r.records.outcome_rate).toBe(67);
  });

  it("100% outcome rate when all have outcomes", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_outcome: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_outcome: true }),
      ],
    }));
    expect(r.records.outcome_rate).toBe(100);
  });

  // ── Medication ────────────────────────────────────────────────────────────

  it("counts active medications", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medications: [
        makeMedication({ id: "m1", is_active: true }),
        makeMedication({ id: "m2", is_active: true }),
        makeMedication({ id: "m3", is_active: false }),
      ],
    }));
    expect(r.medication.active_medications).toBe(2);
  });

  it("calculates administered rate correctly", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "administered" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "administered" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
      ],
    }));
    expect(r.medication.administered_rate).toBe(67);
  });

  it("counts refused and missed correctly", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "administered" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "refused" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
        makeMedAdmin({ id: "a4", date: "2026-05-22", status: "late" }),
      ],
    }));
    expect(r.medication.refused_count).toBe(1);
    expect(r.medication.missed_count).toBe(1);
    expect(r.medication.late_count).toBe(1);
  });

  it("excludes scheduled from administered rate", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "administered" }),
        makeMedAdmin({ id: "a2", date: "2026-05-26", status: "scheduled" }),
      ],
    }));
    // Only 1 non-scheduled (administered), so 100%
    expect(r.medication.administered_rate).toBe(100);
  });

  it("returns 100% admin rate when no medications", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medications: [],
      medication_administrations: [],
    }));
    expect(r.medication.administered_rate).toBe(100);
  });

  // ── Coverage ──────────────────────────────────────────────────────────────

  it("detects full dental coverage", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "dental" }),
        makeHealthRecord({ id: "h2", child_id: "yp_jordan", date: "2026-04-10", record_type: "dental" }),
        makeHealthRecord({ id: "h3", child_id: "yp_casey", date: "2026-03-15", record_type: "dental" }),
      ],
    }));
    expect(r.coverage.dental_coverage).toBe(true);
  });

  it("detects incomplete dental coverage", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "dental" }),
        makeHealthRecord({ id: "h2", child_id: "yp_jordan", date: "2026-04-10", record_type: "optical" }),
      ],
    }));
    expect(r.coverage.dental_coverage).toBe(false);
  });

  it("detects mental health monitoring", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "mental_health", status: "monitoring" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "dental" }),
      ],
    }));
    expect(r.coverage.mental_health_monitored).toBe(true);
  });

  it("detects growth monitoring", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "growth" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "dental" }),
      ],
    }));
    expect(r.coverage.growth_monitored).toBe(true);
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    // All children covered, full compliance, good outcomes, medication perfect
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.health_score).toBeGreaterThanOrEqual(80);
    expect(r.health_rating).toBe("outstanding");
  });

  it("rates good (65 <= score < 80)", () => {
    // Decent but some gaps — 6 records brings records_per_child to 2 (+4 bonus)
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "health_assessment" }),
        makeHealthRecord({ id: "h2", child_id: "yp_jordan", date: "2026-04-10", record_type: "dental" }),
        makeHealthRecord({ id: "h3", child_id: "yp_casey", date: "2026-03-15", record_type: "mental_health", status: "monitoring" }),
        makeHealthRecord({ id: "h4", child_id: "yp_alex", date: "2026-04-01", record_type: "dental", has_outcome: false }),
        makeHealthRecord({ id: "h5", child_id: "yp_jordan", date: "2026-03-01", record_type: "health_assessment", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h6", child_id: "yp_casey", date: "2026-02-15", record_type: "optical" }),
      ],
    }));
    expect(r.health_score).toBeGreaterThanOrEqual(65);
    expect(r.health_score).toBeLessThan(80);
    expect(r.health_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // All children covered but mediocre quality: overdue follow-ups, poor outcomes, no dental/optical
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "health_assessment" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h3", child_id: "yp_jordan", date: "2026-04-01", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h4", child_id: "yp_jordan", date: "2026-03-15", record_type: "growth", has_outcome: false }),
        makeHealthRecord({ id: "h5", child_id: "yp_casey", date: "2026-03-01", record_type: "condition", has_outcome: false }),
        makeHealthRecord({ id: "h6", child_id: "yp_casey", date: "2026-02-15", record_type: "referral", status: "referred", has_outcome: false }),
      ],
      medications: [],
      medication_administrations: [],
    }));
    expect(r.health_score).toBeGreaterThanOrEqual(45);
    expect(r.health_score).toBeLessThan(65);
    expect(r.health_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // Terrible coverage, no compliance, missed meds
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h3", child_id: "yp_alex", date: "2026-03-15", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
      ],
      medications: [makeMedication(), makeMedication({ id: "m2" })],
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "missed" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
        makeMedAdmin({ id: "a4", date: "2026-05-22", status: "refused" }),
      ],
    }));
    expect(r.health_score).toBeLessThan(45);
    expect(r.health_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("rewards high record volume", () => {
    const low = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10" }),
      ],
    }));
    const high = computeHomeHealthWellbeing(baseInput());
    expect(high.health_score).toBeGreaterThan(low.health_score);
  });

  it("penalises children without records", () => {
    const allCovered = computeHomeHealthWellbeing(baseInput());
    const someMissing = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
    }));
    expect(someMissing.health_score).toBeLessThan(allCovered.health_score);
  });

  it("rewards health assessments", () => {
    const noHA = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "dental" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "dental" }),
        makeHealthRecord({ id: "h3", date: "2026-03-15", record_type: "optical" }),
      ],
    }));
    const withHA = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "health_assessment" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "health_assessment" }),
        makeHealthRecord({ id: "h3", date: "2026-03-15", record_type: "health_assessment" }),
      ],
    }));
    expect(withHA.health_score).toBeGreaterThan(noHA.health_score);
  });

  it("penalises overdue follow-ups", () => {
    const noOverdue = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: false }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_follow_up: true, follow_up_overdue: false }),
      ],
    }));
    const withOverdue = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h3", date: "2026-03-15", has_follow_up: true, follow_up_overdue: true }),
      ],
    }));
    expect(withOverdue.health_score).toBeLessThan(noOverdue.health_score);
  });

  it("penalises poor medication compliance", () => {
    const goodMeds = computeHomeHealthWellbeing(baseInput({
      medications: [makeMedication()],
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "administered" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "administered" }),
      ],
    }));
    const badMeds = computeHomeHealthWellbeing(baseInput({
      medications: [makeMedication()],
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "missed" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
      ],
    }));
    expect(badMeds.health_score).toBeLessThan(goodMeds.health_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength when all children have records", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("all children"))).toBe(true);
  });

  it("notes strength for 100% follow-up compliance", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("follow-up compliance"))).toBe(true);
  });

  it("notes strength for good outcome documentation", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("outcome"))).toBe(true);
  });

  it("notes strength for 100% medication admin rate", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("medication"))).toBe(true);
  });

  it("notes strength for mental health monitoring", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("mental health"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for children without records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("no health records"))).toBe(true);
  });

  it("raises concern for overdue follow-ups", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("raises concern for missed medications", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "administered" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("missed medication"))).toBe(true);
  });

  it("raises concern for refused medications", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "refused" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "administered" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("refused"))).toBe(true);
  });

  it("raises concern for no health assessments", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "dental" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "optical" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("no health assessments"))).toBe(true);
  });

  it("raises concern for incomplete dental coverage", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "dental" }),
        makeHealthRecord({ id: "h2", child_id: "yp_jordan", date: "2026-04-10", record_type: "health_assessment" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("dental"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends health assessments for uncovered children", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.regulatory_ref === "Reg 10" && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends addressing overdue follow-ups", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", date: "2026-04-10" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("recommends dental check-ups when coverage missing", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20", record_type: "health_assessment" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10", record_type: "optical" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("dental"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
      medications: [makeMedication()],
      medication_administrations: [makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" })],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 0; i < ranks.length - 1; i++) {
      expect(ranks[i]).toBeLessThan(ranks[i + 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for children without records", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("generates critical insight for multiple missed meds", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "missed" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("missed"))).toBe(true);
  });

  it("generates positive insight for comprehensive monitoring", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });

  it("generates positive insight for perfect medication", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("medication"))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions outstanding", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", child_id: "yp_alex", date: "2026-05-20", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h2", child_id: "yp_alex", date: "2026-04-10", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
        makeHealthRecord({ id: "h3", child_id: "yp_alex", date: "2026-03-15", record_type: "condition", has_outcome: false, has_follow_up: true, follow_up_overdue: true }),
      ],
      medications: [makeMedication(), makeMedication({ id: "m2" })],
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-05-25", status: "missed" }),
        makeMedAdmin({ id: "a2", date: "2026-05-24", status: "missed" }),
        makeMedAdmin({ id: "a3", date: "2026-05-23", status: "missed" }),
        makeMedAdmin({ id: "a4", date: "2026-05-22", status: "refused" }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Score Clamping ────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: Array.from({ length: 3 }, (_, i) => makeHealthRecord({
        id: `h${i}`,
        child_id: "yp_alex",
        date: `2026-05-${String(20 - i).padStart(2, "0")}`,
        record_type: "condition",
        has_outcome: false,
        has_follow_up: true,
        follow_up_overdue: true,
      })),
      medications: [makeMedication(), makeMedication({ id: "m2" }), makeMedication({ id: "m3" })],
      medication_administrations: Array.from({ length: 10 }, (_, i) => makeMedAdmin({
        id: `a${i}`,
        date: `2026-05-${String(20 - (i % 10)).padStart(2, "0")}`,
        status: "missed",
      })),
    }));
    expect(r.health_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeHealthWellbeing(baseInput());
    expect(r.health_score).toBeLessThanOrEqual(100);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles future-dated records gracefully", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-06-15" }), // future
        makeHealthRecord({ id: "h2", date: "2026-05-20" }),
        makeHealthRecord({ id: "h3", date: "2026-04-10" }),
      ],
    }));
    expect(r.records.total_records_180d).toBe(2); // future excluded
  });

  it("handles zero children gracefully", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      total_children: 0,
      child_ids: [],
      health_records: [
        makeHealthRecord({ id: "h1", date: "2026-05-20" }),
        makeHealthRecord({ id: "h2", date: "2026-04-10" }),
      ],
    }));
    expect(r.records.records_per_child).toBe(0);
    expect(r.health_score).toBeGreaterThanOrEqual(0);
  });

  it("handles medication admins outside 30d window", () => {
    const r = computeHomeHealthWellbeing(baseInput({
      medication_administrations: [
        makeMedAdmin({ id: "a1", date: "2026-04-01" }), // >30d ago
      ],
    }));
    expect(r.medication.admin_records_30d).toBe(0);
  });
});
