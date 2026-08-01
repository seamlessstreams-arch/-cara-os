import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateNeurodiversitySupport,
  type NeurodiversitySupportRow,
} from "./neurodiversity-support-service";

function makeRow(overrides: Partial<NeurodiversitySupportRow> = {}): NeurodiversitySupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Charlie Evans",
    assessment_date: "2026-04-01",
    assessor_name: "Dr Jones",
    condition_type: "Autism Spectrum",
    diagnosis_status: "Formal Diagnosis",
    ehcp_in_place: true,
    specialist_involved: true,
    specialist_type: "Educational Psychologist",
    reasonable_adjustments: "Visual schedule, quiet space available",
    sensory_profile_completed: true,
    communication_plan: true,
    behaviour_support_plan: true,
    staff_training_completed: true,
    school_liaison: true,
    camhs_involved: true,
    ot_involved: false,
    salt_involved: false,
    social_worker_informed: true,
    medication_managed: false,
    medication_details: null,
    transition_plan: true,
    review_date: "2026-10-01",
    status: "Active",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.ehcp_rate).toBeNull();;
    expect(m.active_records).toBe(0);
    expect(m.overdue_reviews).toBe(0);
  });

  it("computes breakdown and rates for populated data", () => {
    const rows = [
      makeRow({ id: "r-1", child_name: "Charlie Evans", ehcp_in_place: true, specialist_involved: true }),
      makeRow({ id: "r-2", child_name: "Sam Rivers", ehcp_in_place: false, specialist_involved: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(2);
    expect(m.unique_children).toBe(2);
    expect(m.ehcp_rate).toBe(50);
    expect(m.specialist_rate).toBe(50);
    expect(m.by_condition_type["Autism Spectrum"]).toBe(2);
  });

  it("counts overdue reviews", () => {
    const rows = [
      makeRow({ id: "r-1", status: "Active", review_date: "2026-01-01" }), // overdue
      makeRow({ id: "r-2", status: "Active", review_date: "2027-01-01" }), // future
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_reviews).toBe(1);
  });

  it("computes multi-agency involvement rate (>= 2 of camhs/ot/salt/specialist)", () => {
    const rows = [
      makeRow({ id: "r-1", camhs_involved: true, ot_involved: true, salt_involved: false, specialist_involved: false }),
      makeRow({ id: "r-2", camhs_involved: false, ot_involved: false, salt_involved: false, specialist_involved: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.multi_agency_involvement_rate).toBe(50);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("flags no_reasonable_adjustments (critical) for active record with empty adjustments", () => {
    const rows = [makeRow({ status: "Active", reasonable_adjustments: "" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "no_reasonable_adjustments");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags no_ehcp_formal_diagnosis (critical) for learning condition with formal diagnosis and no EHCP", () => {
    const rows = [
      makeRow({
        condition_type: "Dyslexia",
        diagnosis_status: "Formal Diagnosis",
        ehcp_in_place: false,
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "no_ehcp_formal_diagnosis");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags no_sensory_profile (critical) for autism without sensory profile", () => {
    const rows = [
      makeRow({
        condition_type: "Autism Spectrum",
        sensory_profile_completed: false,
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "no_sensory_profile");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags no_communication_plan (high) for speech disorder without plan", () => {
    const rows = [
      makeRow({
        condition_type: "Speech & Language Disorder",
        communication_plan: false,
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "no_communication_plan");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags staff_training_incomplete (high) for active records without training", () => {
    const rows = [makeRow({ staff_training_completed: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "staff_training_incomplete");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags medication_sw_not_informed (high) when medication managed but SW not informed", () => {
    const rows = [
      makeRow({
        medication_managed: true,
        medication_details: "Methylphenidate 10mg",
        social_worker_informed: false,
        status: "Active",
      }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "medication_sw_not_informed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags suspected_no_referral (high)", () => {
    const rows = [
      makeRow({ diagnosis_status: "Suspected — No Referral", status: "Active" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "suspected_no_referral");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });
});

// ── validateNeurodiversitySupport ──────────────────────────────────────

describe("validateNeurodiversitySupport", () => {
  it("returns valid for correct input", () => {
    const result = validateNeurodiversitySupport({
      childName: "Charlie",
      assessmentDate: "2026-04-01",
      assessorName: "Dr Jones",
      conditionType: "Autism Spectrum",
      diagnosisStatus: "Formal Diagnosis",
      reasonableAdjustments: "Visual timetable",
      status: "Active",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("errors when specialist involved but no specialist type", () => {
    const result = validateNeurodiversitySupport({
      childName: "Charlie",
      assessmentDate: "2026-04-01",
      assessorName: "Dr Jones",
      conditionType: "ADHD",
      specialistInvolved: true,
      specialistType: "",
      reasonableAdjustments: "Fidget tools",
      status: "Active",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Specialist type"))).toBe(true);
  });

  it("errors when medication managed without details", () => {
    const result = validateNeurodiversitySupport({
      childName: "Charlie",
      assessmentDate: "2026-04-01",
      assessorName: "Dr Jones",
      conditionType: "ADHD",
      medicationManaged: true,
      medicationDetails: "",
      reasonableAdjustments: "Fidget tools",
      status: "Active",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Medication details"))).toBe(true);
  });
});
