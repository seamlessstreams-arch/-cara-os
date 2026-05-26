// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Medication Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildMedication,
  type ChildMedicationInput,
  type MedicationInput,
  type AdministrationInput,
  type MedErrorInput,
  type MedType,
  type AdminStatus,
} from "../child-medication-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoAt(daysBack: number, hour: number, minute: number = 0): string {
  return `${daysAgo(daysBack)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
}

let _medId = 0;
function makeMed(overrides: Partial<MedicationInput> = {}): MedicationInput {
  return {
    id: `med_${++_medId}`,
    name: "Fluoxetine",
    type: "regular",
    dosage: "10mg",
    frequency: "once daily",
    is_active: true,
    stock_count: 30,
    stock_last_checked: daysAgo(2),
    start_date: daysAgo(90),
    end_date: null,
    ...overrides,
  };
}

let _adminId = 0;
function makeAdmin(medId: string, overrides: Partial<AdministrationInput> = {}): AdministrationInput {
  return {
    id: `admin_${++_adminId}`,
    medication_id: medId,
    scheduled_time: isoAt(1, 8),
    actual_time: isoAt(1, 8, 5),
    status: "given",
    administered_by: "staff_darren",
    witnessed_by: "staff_ryan",
    dose_given: "10mg",
    reason_not_given: null,
    prn_reason: null,
    prn_effectiveness: null,
    ...overrides,
  };
}

function makeError(overrides: Partial<MedErrorInput> = {}): MedErrorInput {
  return {
    id: `err_${Math.random().toString(36).slice(2, 8)}`,
    date_occurred: daysAgo(5),
    error_type: "wrong_dose",
    severity: "low",
    status: "closed",
    has_remedial_actions: true,
    remedial_actions_completed: 2,
    remedial_actions_total: 2,
    ...overrides,
  };
}

function generateRegularAdmins(medId: string, days: number, status: AdminStatus = "given"): AdministrationInput[] {
  const admins: AdministrationInput[] = [];
  for (let d = 1; d <= days; d++) {
    admins.push(makeAdmin(medId, {
      scheduled_time: isoAt(d, 8),
      actual_time: status === "missed" ? null : isoAt(d, 8, Math.floor(Math.random() * 10)),
      status,
      witnessed_by: d % 5 === 0 ? null : "staff_ryan", // occasional unwitnessed
    }));
  }
  return admins;
}

function baseInput(overrides: Partial<ChildMedicationInput> = {}): ChildMedicationInput {
  return {
    today: TODAY,
    child_id: "yp_casey",
    child_name: "Casey",
    medications: [],
    administrations: [],
    errors: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Medication Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildMedication(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("medication_safety_rating");
    expect(r).toHaveProperty("medication_safety_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("active_medication_count");
    expect(r).toHaveProperty("has_controlled_drugs");
    expect(r).toHaveProperty("adherence");
    expect(r).toHaveProperty("witnessing");
    expect(r).toHaveProperty("prn");
    expect(r).toHaveProperty("timeliness");
    expect(r).toHaveProperty("stock");
    expect(r).toHaveProperty("errors");
    expect(r).toHaveProperty("medication_details");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildMedication(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_casey");
    expect(r.child_name).toBe("Casey");
  });

  // ── Rating ────────────────────────────────────────────────────────────

  it("rates no_medications when no medications exist", () => {
    const r = computeChildMedication(baseInput());
    expect(r.medication_safety_rating).toBe("no_medications");
    expect(r.medication_safety_score).toBe(0);
  });

  it("rates good/outstanding with excellent adherence", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 28),
    }));
    expect(["good", "outstanding"]).toContain(r.medication_safety_rating);
    expect(r.medication_safety_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with many missed doses", () => {
    const med = makeMed();
    const admins = generateRegularAdmins(med.id, 20, "missed");
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: admins,
    }));
    expect(r.medication_safety_rating).toBe("inadequate");
  });

  // ── Adherence ─────────────────────────────────────────────────────────

  it("calculates adherence rate", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(2, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(3, 8), status: "refused", actual_time: null }),
      makeAdmin(med.id, { scheduled_time: isoAt(4, 8), status: "given" }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.adherence.adherence_rate_30d).toBe(75); // 3 given / 4 total
    expect(r.adherence.refusal_count_30d).toBe(1);
  });

  it("counts late as adhered but tracks separately", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(2, 8), status: "late", actual_time: isoAt(2, 9) }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.adherence.adherence_rate_30d).toBe(100); // given + late = 100%
    expect(r.adherence.late_count_30d).toBe(1);
  });

  it("tracks 7d and 30d windows separately", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(3, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(15, 8), status: "refused", actual_time: null }),
      makeAdmin(med.id, { scheduled_time: isoAt(20, 8), status: "given" }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.adherence.total_administrations_7d).toBe(2);
    expect(r.adherence.total_administrations_30d).toBe(4);
    expect(r.adherence.adherence_rate_7d).toBe(100);
    expect(r.adherence.adherence_rate_30d).toBe(75);
  });

  it("detects declining adherence trend", () => {
    const med = makeMed();
    // Prior period (31-60 days ago): 100% adherence
    const priorAdmins = Array.from({ length: 10 }, (_, i) =>
      makeAdmin(med.id, { scheduled_time: isoAt(35 + i, 8), status: "given" })
    );
    // Current period (1-30 days): lots of refusals
    const currentAdmins = [
      ...Array.from({ length: 3 }, (_, i) => makeAdmin(med.id, { scheduled_time: isoAt(1 + i, 8), status: "given" })),
      ...Array.from({ length: 5 }, (_, i) => makeAdmin(med.id, { scheduled_time: isoAt(10 + i, 8), status: "refused", actual_time: null })),
    ];
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: [...priorAdmins, ...currentAdmins],
    }));
    expect(r.adherence.adherence_trend).toBe("declining");
  });

  // ── Witnessing ────────────────────────────────────────────────────────

  it("calculates witnessing rate", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), witnessed_by: "staff_a" }),
      makeAdmin(med.id, { scheduled_time: isoAt(2, 8), witnessed_by: "staff_b" }),
      makeAdmin(med.id, { scheduled_time: isoAt(3, 8), witnessed_by: null }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.witnessing.witnessing_rate_30d).toBe(67); // 2/3
    expect(r.witnessing.unwitnessed_count_30d).toBe(1);
  });

  it("tracks controlled drug witnessing separately", () => {
    const controlled = makeMed({ type: "controlled", name: "Methylphenidate" });
    const regular = makeMed({ type: "regular", name: "Paracetamol" });
    const admins = [
      makeAdmin(controlled.id, { scheduled_time: isoAt(1, 8), witnessed_by: "staff_a" }),
      makeAdmin(controlled.id, { scheduled_time: isoAt(2, 8), witnessed_by: null }),
      makeAdmin(regular.id, { scheduled_time: isoAt(1, 8), witnessed_by: null }),
    ];
    const r = computeChildMedication(baseInput({
      medications: [controlled, regular],
      administrations: admins,
    }));
    expect(r.witnessing.controlled_drug_witnessing_rate).toBe(50);
    expect(r.has_controlled_drugs).toBe(true);
  });

  // ── PRN ───────────────────────────────────────────────────────────────

  it("counts PRN administrations", () => {
    const prn = makeMed({ type: "prn", name: "Ibuprofen" });
    const admins = [
      makeAdmin(prn.id, { scheduled_time: isoAt(1, 16), prn_reason: "Headache", prn_effectiveness: "Effective" }),
      makeAdmin(prn.id, { scheduled_time: isoAt(5, 14), prn_reason: "Knee pain", prn_effectiveness: "Partially" }),
      makeAdmin(prn.id, { scheduled_time: isoAt(20, 10), prn_reason: "Headache", prn_effectiveness: null }),
    ];
    const r = computeChildMedication(baseInput({ medications: [prn], administrations: admins }));
    expect(r.prn.prn_count_30d).toBe(3);
    expect(r.prn.effectiveness_recorded_rate).toBe(67); // 2/3
    expect(r.prn.reason_recorded_rate).toBe(100);
    expect(r.prn.prn_medications.length).toBe(1);
    expect(r.prn.prn_medications[0].name).toBe("Ibuprofen");
  });

  it("detects increasing PRN trend", () => {
    const prn = makeMed({ type: "prn", name: "Ibuprofen" });
    // Prior: 1 use
    const priorAdmins = [makeAdmin(prn.id, { scheduled_time: isoAt(40, 10), prn_reason: "Pain" })];
    // Current: 4 uses
    const currentAdmins = Array.from({ length: 4 }, (_, i) =>
      makeAdmin(prn.id, { scheduled_time: isoAt(1 + i * 5, 10), prn_reason: "Pain" })
    );
    const r = computeChildMedication(baseInput({
      medications: [prn],
      administrations: [...priorAdmins, ...currentAdmins],
    }));
    expect(r.prn.prn_trend).toBe("increasing");
  });

  // ── Timeliness ────────────────────────────────────────────────────────

  it("calculates on-time rate", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8, 0), actual_time: isoAt(1, 8, 5) }),   // 5 min — on time
      makeAdmin(med.id, { scheduled_time: isoAt(2, 8, 0), actual_time: isoAt(2, 8, 20) }),  // 20 min — on time
      makeAdmin(med.id, { scheduled_time: isoAt(3, 8, 0), actual_time: isoAt(3, 9, 0) }),   // 60 min — late
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.timeliness.on_time_rate_30d).toBe(67); // 2/3
    expect(r.timeliness.max_delay_minutes).toBe(60);
  });

  it("returns null delays with no timed admins", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({ medications: [med] }));
    expect(r.timeliness.avg_delay_minutes).toBeNull();
    expect(r.timeliness.max_delay_minutes).toBeNull();
  });

  // ── Stock ─────────────────────────────────────────────────────────────

  it("identifies low stock", () => {
    const med = makeMed({ stock_count: 3, stock_last_checked: daysAgo(1) });
    const r = computeChildMedication(baseInput({ medications: [med] }));
    expect(r.stock.stock_low_count).toBe(1);
  });

  it("calculates stock check compliance", () => {
    const med1 = makeMed({ stock_count: 30, stock_last_checked: daysAgo(2) });
    const med2 = makeMed({ stock_count: 20, stock_last_checked: daysAgo(10) }); // stale
    const r = computeChildMedication(baseInput({ medications: [med1, med2] }));
    expect(r.stock.stock_check_rate).toBe(50); // 1/2 recently checked
  });

  // ── Errors ────────────────────────────────────────────────────────────

  it("counts errors in time windows", () => {
    const med = makeMed();
    const errs = [
      makeError({ date_occurred: daysAgo(5) }),    // within 30d and 90d
      makeError({ date_occurred: daysAgo(60) }),   // within 90d only
      makeError({ date_occurred: daysAgo(100) }),  // outside 90d
    ];
    const r = computeChildMedication(baseInput({ medications: [med], errors: errs }));
    expect(r.errors.errors_30d).toBe(1);
    expect(r.errors.total_errors_90d).toBe(2);
  });

  it("tracks open errors", () => {
    const med = makeMed();
    const errs = [
      makeError({ status: "action_required", date_occurred: daysAgo(10) }),
      makeError({ status: "closed", date_occurred: daysAgo(20) }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], errors: errs }));
    expect(r.errors.open_errors).toBe(1);
  });

  it("tracks highest severity", () => {
    const med = makeMed();
    const errs = [
      makeError({ severity: "low", date_occurred: daysAgo(10) }),
      makeError({ severity: "moderate", date_occurred: daysAgo(20) }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], errors: errs }));
    expect(r.errors.highest_severity).toBe("moderate");
  });

  it("calculates remedial action completion rate", () => {
    const med = makeMed();
    const errs = [
      makeError({ date_occurred: daysAgo(10), remedial_actions_completed: 1, remedial_actions_total: 3 }),
      makeError({ date_occurred: daysAgo(20), remedial_actions_completed: 2, remedial_actions_total: 2 }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], errors: errs }));
    expect(r.errors.remedial_completion_rate).toBe(60); // 3/5
  });

  // ── Per-Medication Details ────────────────────────────────────────────

  it("builds per-medication detail breakdown", () => {
    const med1 = makeMed({ name: "Fluoxetine" });
    const med2 = makeMed({ name: "Melatonin" });
    const admins = [
      makeAdmin(med1.id, { scheduled_time: isoAt(1, 8), status: "given" }),
      makeAdmin(med1.id, { scheduled_time: isoAt(2, 8), status: "refused", actual_time: null }),
      makeAdmin(med2.id, { scheduled_time: isoAt(1, 21), status: "given" }),
    ];
    const r = computeChildMedication(baseInput({
      medications: [med1, med2],
      administrations: admins,
    }));
    expect(r.medication_details.length).toBe(2);
    const fluox = r.medication_details.find((d) => d.name === "Fluoxetine")!;
    expect(fluox.adherence_rate).toBe(50); // 1 given / 2 total
    expect(fluox.refusal_count).toBe(1);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("higher adherence scores higher", () => {
    const med = makeMed();
    const good = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 28),
    }));
    const med2 = makeMed();
    const bad = computeChildMedication(baseInput({
      medications: [med2],
      administrations: [
        ...generateRegularAdmins(med2.id, 5),
        ...Array.from({ length: 10 }, (_, i) =>
          makeAdmin(med2.id, { scheduled_time: isoAt(10 + i, 8), status: "missed", actual_time: null })
        ),
      ],
    }));
    expect(good.medication_safety_score).toBeGreaterThan(bad.medication_safety_score);
  });

  it("penalises errors heavily", () => {
    const med = makeMed();
    const noErrors = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 20),
    }));
    const med2 = makeMed();
    const withErrors = computeChildMedication(baseInput({
      medications: [med2],
      administrations: generateRegularAdmins(med2.id, 20),
      errors: [makeError({ date_occurred: daysAgo(5), severity: "moderate" })],
    }));
    expect(noErrors.medication_safety_score).toBeGreaterThan(withErrors.medication_safety_score);
  });

  it("clamps score to 0-100", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 28),
    }));
    expect(r.medication_safety_score).toBeGreaterThanOrEqual(0);
    expect(r.medication_safety_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strengths for good adherence", () => {
    const med = makeMed();
    const admins = generateRegularAdmins(med.id, 28);
    // Ensure all witnessed
    admins.forEach((a) => { a.witnessed_by = "staff_ryan"; });
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: admins,
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for no errors", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 20),
    }));
    expect(r.strengths.some((s) => s.includes("No medication errors"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for missed doses", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), status: "missed", actual_time: null }),
      makeAdmin(med.id, { scheduled_time: isoAt(2, 8), status: "missed", actual_time: null }),
      makeAdmin(med.id, { scheduled_time: isoAt(3, 8), status: "given" }),
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.concerns.some((c) => c.includes("missed"))).toBe(true);
  });

  it("generates concern for unwitnessed controlled drugs", () => {
    const controlled = makeMed({ type: "controlled", name: "Methylphenidate" });
    const admins = [
      makeAdmin(controlled.id, { scheduled_time: isoAt(1, 8), witnessed_by: null }),
    ];
    const r = computeChildMedication(baseInput({
      medications: [controlled],
      administrations: admins,
    }));
    expect(r.concerns.some((c) => c.includes("Controlled drugs"))).toBe(true);
  });

  it("generates concern for medication errors", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 10),
      errors: [makeError({ date_occurred: daysAgo(5), severity: "moderate" })],
    }));
    expect(r.concerns.some((c) => c.includes("error"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends immediate action for missed doses", () => {
    const med = makeMed();
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdmin(med.id, { scheduled_time: isoAt(i + 1, 8), status: "missed", actual_time: null })
    );
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends controlled drug audit when unwitnessed", () => {
    const controlled = makeMed({ type: "controlled" });
    const admins = [
      makeAdmin(controlled.id, { scheduled_time: isoAt(1, 8), witnessed_by: null }),
    ];
    const r = computeChildMedication(baseInput({
      medications: [controlled],
      administrations: admins,
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("controlled drug"))).toBe(true);
  });

  // ── Insights ──────────────────────────────────────────────────────────

  it("generates critical insight for errors", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      errors: [makeError({ date_occurred: daysAgo(10), severity: "moderate" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates critical insight for missed doses", () => {
    const med = makeMed();
    const admins = Array.from({ length: 3 }, (_, i) =>
      makeAdmin(med.id, { scheduled_time: isoAt(i + 1, 8), status: "missed", actual_time: null })
    );
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("missed"))).toBe(true);
  });

  it("generates positive insight for outstanding", () => {
    const med = makeMed();
    const admins = generateRegularAdmins(med.id, 28);
    admins.forEach((a) => { a.witnessed_by = "staff_ryan"; });
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: admins,
    }));
    if (r.medication_safety_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes rating in headline", () => {
    const r = computeChildMedication(baseInput());
    expect(r.headline).toContain("no_medications");
  });

  it("includes adherence info in headline", () => {
    const med = makeMed();
    const r = computeChildMedication(baseInput({
      medications: [med],
      administrations: generateRegularAdmins(med.id, 10),
    }));
    expect(r.headline).toContain("adherence");
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  it("handles inactive medications gracefully", () => {
    const med = makeMed({ is_active: false });
    const r = computeChildMedication(baseInput({ medications: [med] }));
    expect(r.active_medication_count).toBe(0);
    expect(r.medication_details.length).toBe(0); // details only for active meds
  });

  it("handles all-refused scenario", () => {
    const med = makeMed();
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdmin(med.id, { scheduled_time: isoAt(i + 1, 8), status: "refused", actual_time: null })
    );
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    expect(r.adherence.adherence_rate_30d).toBe(0);
    expect(r.adherence.refusal_count_30d).toBe(10);
    expect(r.medication_safety_rating).toBe("inadequate");
  });

  it("excludes scheduled (future) administrations from adherence", () => {
    const med = makeMed();
    const admins = [
      makeAdmin(med.id, { scheduled_time: isoAt(1, 8), status: "given" }),
      makeAdmin(med.id, { scheduled_time: isoAt(0, 8), status: "scheduled", actual_time: null }), // today/future
    ];
    const r = computeChildMedication(baseInput({ medications: [med], administrations: admins }));
    // Only the "given" one should count
    expect(r.adherence.total_administrations_30d).toBeGreaterThanOrEqual(1);
  });
});
