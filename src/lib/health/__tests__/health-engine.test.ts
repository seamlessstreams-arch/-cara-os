// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Health & Wellbeing — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateHealthCompliance,
  calculateHomeHealthMetrics,
  getAssessmentTypeLabel,
  getSDQBandLabel,
} from "../health-engine";
import type {
  ChildHealthRecord,
  HealthAssessment,
  MedicationRecord,
  AppointmentRecord,
} from "../health-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeAssessment(type: HealthAssessment["type"], date: string): HealthAssessment {
  return {
    type,
    date,
    assessedBy: "LAC Nurse",
    outcome: "Satisfactory",
    actionPlan: [],
    nextDueDate: "2027-05-01T00:00:00Z",
  };
}

function makeMedication(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return {
    id: "med-001",
    name: "Melatonin",
    type: "regular",
    dose: "2mg",
    frequency: "Once nightly",
    prescribedBy: "Dr Smith",
    startDate: "2025-09-01T00:00:00Z",
    active: true,
    sideEffectsMonitored: true,
    consentObtained: true,
    lastReviewDate: "2026-04-01T00:00:00Z",
    nextReviewDate: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "apt-001",
    type: "GP",
    date: "2026-05-10T10:00:00Z",
    provider: "Dr Smith",
    status: "attended",
    followUpRequired: false,
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ChildHealthRecord> = {}): ChildHealthRecord {
  return {
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    dateOfBirth: "2010-06-15T00:00:00Z",
    gpName: "Dr Smith",
    gpSurgery: "Oakfield Medical Centre",
    dentist: "Mr Patel (Smile Dental)",
    optician: "Specsavers",
    healthAssessments: [
      makeAssessment("iha", "2024-09-20T00:00:00Z"),
      makeAssessment("rha", "2025-10-01T00:00:00Z"),
      makeAssessment("dental", "2026-02-15T00:00:00Z"),
      makeAssessment("optical", "2025-11-01T00:00:00Z"),
    ],
    lacEntryDate: "2024-09-01T00:00:00Z",
    medications: [makeMedication()],
    appointments: [
      makeAppointment(),
      makeAppointment({ id: "apt-2", type: "CAMHS", date: "2026-04-20T00:00:00Z", status: "attended" }),
      makeAppointment({ id: "apt-3", type: "Dentist", date: "2026-05-20T00:00:00Z", status: "scheduled" }),
    ],
    immunisationsUpToDate: true,
    lastSDQDate: "2026-01-15T00:00:00Z",
    lastSDQScore: 12,
    sdqBand: "normal",
    knownConditions: ["ADHD"],
    allergies: ["Penicillin"],
    dietaryRequirements: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthCompliance", () => {
  it("returns compliant for good health record", () => {
    const record = makeRecord();
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.ihaCompliant).toBe(true);
    expect(result.dentalCompliant).toBe(true);
    expect(result.sdqCompliant).toBe(true);
    expect(result.immunisationsCompliant).toBe(true);
    expect(result.medicationCompliant).toBe(true);
  });

  it("flags missing IHA", () => {
    const record = makeRecord({
      healthAssessments: [],
      lacEntryDate: "2025-01-01T00:00:00Z", // well past 20 working days
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.ihaCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("IHA"))).toBe(true);
  });

  it("flags overdue RHA", () => {
    const record = makeRecord({
      healthAssessments: [
        makeAssessment("iha", "2024-09-20T00:00:00Z"),
        makeAssessment("rha", "2025-01-01T00:00:00Z"), // >12 months ago
      ],
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.rhaCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Review Health Assessment"))).toBe(true);
  });

  it("flags overdue dental (>6 months)", () => {
    const record = makeRecord({
      healthAssessments: [
        makeAssessment("iha", "2024-09-20T00:00:00Z"),
        makeAssessment("rha", "2025-10-01T00:00:00Z"),
        makeAssessment("dental", "2025-09-01T00:00:00Z"), // >6 months
        makeAssessment("optical", "2025-11-01T00:00:00Z"),
      ],
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.dentalCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Dental"))).toBe(true);
  });

  it("flags overdue optical (>12 months)", () => {
    const record = makeRecord({
      healthAssessments: [
        makeAssessment("iha", "2024-09-20T00:00:00Z"),
        makeAssessment("rha", "2025-10-01T00:00:00Z"),
        makeAssessment("dental", "2026-02-15T00:00:00Z"),
        makeAssessment("optical", "2025-01-01T00:00:00Z"), // >12 months
      ],
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.opticalCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Optical"))).toBe(true);
  });

  it("flags overdue SDQ", () => {
    const record = makeRecord({ lastSDQDate: "2025-01-01T00:00:00Z" });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.sdqCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("SDQ"))).toBe(true);
  });

  it("generates recommendation for abnormal SDQ", () => {
    const record = makeRecord({ lastSDQScore: 22, sdqBand: "abnormal" });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("CAMHS"))).toBe(true);
  });

  it("flags immunisations not up to date", () => {
    const record = makeRecord({ immunisationsUpToDate: false });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.immunisationsCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Immunisations"))).toBe(true);
  });

  it("flags medication overdue for review", () => {
    const record = makeRecord({
      medications: [makeMedication({ nextReviewDate: "2026-04-01T00:00:00Z" })], // overdue
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.medicationCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("overdue for review"))).toBe(true);
  });

  it("flags medication without consent", () => {
    const record = makeRecord({
      medications: [makeMedication({ consentObtained: false })],
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.medicationCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Consent"))).toBe(true);
  });

  it("calculates DNA rate", () => {
    const record = makeRecord({
      appointments: [
        makeAppointment({ status: "attended" }),
        makeAppointment({ id: "a2", status: "attended" }),
        makeAppointment({ id: "a3", status: "dna" }),
        makeAppointment({ id: "a4", status: "dna" }),
      ],
    });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.dnaRate).toBe(50);
    expect(result.recommendations.some(r => r.includes("DNA rate"))).toBe(true);
  });

  it("handles child with no appointments gracefully", () => {
    const record = makeRecord({ appointments: [] });
    const result = evaluateHealthCompliance(record, FIXED_NOW);
    expect(result.dnaRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeHealthMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeHealthMetrics", () => {
  it("calculates overall compliance rate", () => {
    const records = [
      makeRecord({ childId: "c1" }), // compliant
      makeRecord({ childId: "c2", immunisationsUpToDate: false }), // non-compliant
    ];
    const result = calculateHomeHealthMetrics(records, "home-oak", FIXED_NOW);
    expect(result.overallComplianceRate).toBe(50);
  });

  it("counts active medications and overdue reviews", () => {
    const records = [
      makeRecord({
        childId: "c1",
        medications: [
          makeMedication({ active: true }),
          makeMedication({ id: "m2", active: true, nextReviewDate: "2026-03-01T00:00:00Z" }), // overdue
          makeMedication({ id: "m3", active: false }),
        ],
      }),
    ];
    const result = calculateHomeHealthMetrics(records, "home-oak", FIXED_NOW);
    expect(result.totalActiveMedications).toBe(2);
    expect(result.medicationsOverdueReview).toBe(1);
  });

  it("lists upcoming appointments", () => {
    const records = [
      makeRecord({
        childId: "c1",
        appointments: [
          makeAppointment({ date: "2026-05-20T10:00:00Z", status: "scheduled", type: "CAMHS" }),
          makeAppointment({ id: "a2", date: "2026-06-15T10:00:00Z", status: "scheduled", type: "GP" }), // >14 days
        ],
      }),
    ];
    const result = calculateHomeHealthMetrics(records, "home-oak", FIXED_NOW);
    expect(result.upcomingAppointments).toHaveLength(1);
    expect(result.upcomingAppointments[0].type).toBe("CAMHS");
  });

  it("aggregates concerns from all children", () => {
    const records = [
      makeRecord({ childId: "c1", immunisationsUpToDate: false }),
      makeRecord({ childId: "c2", lastSDQDate: "2024-01-01T00:00:00Z" }),
    ];
    const result = calculateHomeHealthMetrics(records, "home-oak", FIXED_NOW);
    expect(result.concerns.length).toBeGreaterThanOrEqual(2);
  });

  it("filters to correct home", () => {
    const records = [
      makeRecord({ childId: "c1", homeId: "home-oak" }),
      makeRecord({ childId: "c2", homeId: "home-elm" }),
    ];
    const result = calculateHomeHealthMetrics(records, "home-oak", FIXED_NOW);
    expect(result.childCount).toBe(1);
  });

  it("returns defaults for no records", () => {
    const result = calculateHomeHealthMetrics([], "home-oak", FIXED_NOW);
    expect(result.childCount).toBe(0);
    expect(result.overallComplianceRate).toBe(100);
    expect(result.immunisationRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getAssessmentTypeLabel returns labels", () => {
    expect(getAssessmentTypeLabel("iha")).toBe("Initial Health Assessment");
    expect(getAssessmentTypeLabel("rha")).toBe("Review Health Assessment");
    expect(getAssessmentTypeLabel("sdq")).toBe("Strengths & Difficulties Questionnaire");
  });

  it("getSDQBandLabel returns labels", () => {
    expect(getSDQBandLabel("normal")).toBe("Normal (0-13)");
    expect(getSDQBandLabel("abnormal")).toBe("Abnormal (17-40)");
  });
});
