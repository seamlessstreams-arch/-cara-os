import { describe, it, expect } from "vitest";
import {
  computeChildHealthIntelligence,
  type ChildHealthIntelligenceInput,
  type MedicationInput,
  type MedicationAdminInput,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type OpticiansRecordInput,
  type ImmunisationInput,
  type CamhsInput,
  type MentalHealthCheckInInput,
  type AppointmentInput,
} from "../child-health-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeMed(overrides: Partial<MedicationInput> = {}): MedicationInput {
  return {
    id: "med_1",
    name: "Sertraline",
    type: "regular",
    dosage: "50mg",
    frequency: "daily",
    is_active: true,
    start_date: "2026-01-01",
    end_date: null,
    ...overrides,
  };
}

function makeAdmin(overrides: Partial<MedicationAdminInput> = {}): MedicationAdminInput {
  return {
    id: "admin_1",
    medication_id: "med_1",
    date: "2026-05-20",
    status: "given",
    witnessed: true,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<HealthAssessmentInput> = {}): HealthAssessmentInput {
  return {
    id: "ha_1",
    type: "annual",
    date: "2026-03-10",
    status: "completed",
    outcome: "Healthy, no concerns identified",
    ...overrides,
  };
}

function makeDental(overrides: Partial<DentalRecordInput> = {}): DentalRecordInput {
  return {
    id: "dent_1",
    date: "2026-04-15",
    type: "check_up",
    outcome: "No issues",
    next_due: "2026-10-15",
    ...overrides,
  };
}

function makeOptician(overrides: Partial<OpticiansRecordInput> = {}): OpticiansRecordInput {
  return {
    id: "opt_1",
    date: "2025-08-10",
    outcome: "20/20 vision, no correction needed",
    next_due: "2027-08-10",
    ...overrides,
  };
}

function makeImmunisation(overrides: Partial<ImmunisationInput> = {}): ImmunisationInput {
  return {
    id: "imm_1",
    vaccine: "HPV",
    date: "2026-02-01",
    status: "completed",
    ...overrides,
  };
}

function makeCamhs(overrides: Partial<CamhsInput> = {}): CamhsInput {
  return {
    id: "camhs_1",
    referral_date: "2025-09-01",
    status: "active",
    sessions_attended: 8,
    sessions_offered: 10,
    engagement_level: "good",
    next_appointment: "2026-06-05",
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<MentalHealthCheckInInput> = {}): MentalHealthCheckInInput {
  return {
    id: "mh_1",
    date: "2026-05-20",
    overall_mood: 4,
    anxiety_level: 2,
    sleep_quality: 4,
    concerns: [],
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<AppointmentInput> = {}): AppointmentInput {
  return {
    id: "appt_1",
    date: "2026-05-10",
    type: "gp",
    attended: true,
    rescheduled: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildHealthIntelligenceInput> = {}): ChildHealthIntelligenceInput {
  return {
    today: TODAY,
    child_id: "yp_1",
    child_name: "Jordan",
    medications: [],
    medication_administrations: [],
    health_assessments: [],
    dental_records: [],
    opticians_records: [],
    immunisations: [],
    camhs: null,
    mental_health_check_ins: [],
    appointments: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeChildHealthIntelligence", () => {
  it("returns all required top-level fields", () => {
    const result = computeChildHealthIntelligence(baseInput());
    expect(result).toHaveProperty("generated_at", TODAY);
    expect(result).toHaveProperty("child_id", "yp_1");
    expect(result).toHaveProperty("child_name", "Jordan");
    expect(result).toHaveProperty("health_status");
    expect(result).toHaveProperty("health_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("medication_compliance");
    expect(result).toHaveProperty("health_compliance");
    expect(result).toHaveProperty("camhs_status");
    expect(result).toHaveProperty("wellbeing_trajectory");
    expect(result).toHaveProperty("appointment_analysis");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  it("rates a child with all checks current and good wellbeing as good or better", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
      immunisations: [makeImmunisation()],
      mental_health_check_ins: [
        makeCheckIn({ id: "mh_1", date: "2026-04-10", overall_mood: 4 }),
        makeCheckIn({ id: "mh_2", date: "2026-04-20", overall_mood: 4 }),
        makeCheckIn({ id: "mh_3", date: "2026-05-10", overall_mood: 5 }),
        makeCheckIn({ id: "mh_4", date: "2026-05-20", overall_mood: 5 }),
      ],
      appointments: [
        makeAppointment({ id: "ap1", date: "2026-05-10" }),
        makeAppointment({ id: "ap2", date: "2026-04-20" }),
        makeAppointment({ id: "ap3", date: "2026-04-10" }),
      ],
    }));
    expect(["excellent", "good"]).toContain(result.health_status);
    expect(result.health_score).toBeGreaterThanOrEqual(65);
  });

  it("rates a child with only health checks current as monitoring", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
      immunisations: [makeImmunisation()],
    }));
    expect(result.health_status).toBe("monitoring");
    expect(result.health_score).toBeGreaterThanOrEqual(50);
  });

  it("generates concern when health assessment is overdue", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment({ date: "2024-01-01" })],
    }));
    expect(result.concerns.some((c) => c.includes("health assessment"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "assessment")).toBe(true);
  });

  it("generates concern when no health assessment at all", () => {
    const result = computeChildHealthIntelligence(baseInput());
    expect(result.health_compliance.health_assessment_current).toBe(false);
    expect(result.health_compliance.health_assessment_last_date).toBeNull();
    expect(result.concerns.some((c) => c.includes("health assessment"))).toBe(true);
  });

  // ── Medication compliance ──────────────────────────────────────────────

  it("computes high medication compliance correctly", () => {
    const meds = [makeMed()];
    const admins = Array.from({ length: 20 }, (_, i) =>
      makeAdmin({ id: `a_${i}`, date: `2026-05-${String(6 + (i % 20)).padStart(2, "0")}` }),
    );
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.given_rate).toBe(100);
    expect(result.medication_compliance.active_medications).toBe(1);
    expect(result.strengths.some((s) => s.includes("compliance"))).toBe(true);
  });

  it("flags low medication compliance", () => {
    const meds = [makeMed()];
    const admins = [
      makeAdmin({ id: "a1", status: "given", date: "2026-05-20" }),
      makeAdmin({ id: "a2", status: "given", date: "2026-05-19" }),
      makeAdmin({ id: "a3", status: "refused", date: "2026-05-18" }),
      makeAdmin({ id: "a4", status: "missed", date: "2026-05-17" }),
      makeAdmin({ id: "a5", status: "refused", date: "2026-05-16" }),
      makeAdmin({ id: "a6", status: "refused", date: "2026-05-15" }),
      makeAdmin({ id: "a7", status: "missed", date: "2026-05-14" }),
      makeAdmin({ id: "a8", status: "refused", date: "2026-05-13" }),
      makeAdmin({ id: "a9", status: "given", date: "2026-05-12" }),
      makeAdmin({ id: "a10", status: "missed", date: "2026-05-11" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.given_rate).toBeLessThan(80);
    expect(result.medication_compliance.refused_count_30d).toBe(4);
    expect(result.medication_compliance.missed_count_30d).toBe(3);
    expect(result.concerns.some((c) => c.includes("Medication compliance"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "medication" && r.urgency === "immediate")).toBe(true);
  });

  it("flags medication refusals specifically", () => {
    const meds = [makeMed()];
    const admins = [
      makeAdmin({ id: "a1", status: "refused", date: "2026-05-20" }),
      makeAdmin({ id: "a2", status: "refused", date: "2026-05-19" }),
      makeAdmin({ id: "a3", status: "refused", date: "2026-05-18" }),
      makeAdmin({ id: "a4", status: "given", date: "2026-05-17" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.refused_count_30d).toBe(3);
    expect(result.concerns.some((c) => c.includes("refusal"))).toBe(true);
    expect(result.recommendations.some((r) => r.recommendation.includes("refusal"))).toBe(true);
  });

  it("tracks witnessed rate", () => {
    const meds = [makeMed()];
    const admins = [
      makeAdmin({ id: "a1", witnessed: true, date: "2026-05-20" }),
      makeAdmin({ id: "a2", witnessed: true, date: "2026-05-19" }),
      makeAdmin({ id: "a3", witnessed: true, date: "2026-05-18" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.witnessed_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("witnessed"))).toBe(true);
  });

  it("produces per-medication compliance summary", () => {
    const meds = [
      makeMed({ id: "med_1", name: "Sertraline" }),
      makeMed({ id: "med_2", name: "Melatonin", type: "regular" }),
    ];
    const admins = [
      makeAdmin({ id: "a1", medication_id: "med_1", status: "given", date: "2026-05-20" }),
      makeAdmin({ id: "a2", medication_id: "med_1", status: "given", date: "2026-05-19" }),
      makeAdmin({ id: "a3", medication_id: "med_2", status: "given", date: "2026-05-20" }),
      makeAdmin({ id: "a4", medication_id: "med_2", status: "refused", date: "2026-05-19" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.medications_summary).toHaveLength(2);
    const sert = result.medication_compliance.medications_summary.find((m) => m.name === "Sertraline");
    const mela = result.medication_compliance.medications_summary.find((m) => m.name === "Melatonin");
    expect(sert?.compliance_rate).toBe(100);
    expect(mela?.compliance_rate).toBe(50);
  });

  it("counts PRN administrations", () => {
    const meds = [makeMed({ id: "med_prn", type: "prn", name: "Lorazepam" })];
    const admins = [
      makeAdmin({ id: "a1", medication_id: "med_prn", date: "2026-05-20" }),
      makeAdmin({ id: "a2", medication_id: "med_prn", date: "2026-05-18" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.prn_count_30d).toBe(2);
  });

  it("excludes scheduled administrations from counts", () => {
    const meds = [makeMed()];
    const admins = [
      makeAdmin({ id: "a1", status: "given", date: "2026-05-20" }),
      makeAdmin({ id: "a2", status: "scheduled", date: "2026-05-27" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.total_administrations_30d).toBe(1);
  });

  // ── Health compliance ─────────────────────────────────────────────────

  it("marks dental as current when within 365 days", () => {
    const result = computeChildHealthIntelligence(baseInput({
      dental_records: [makeDental()],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.dental_current).toBe(true);
    expect(result.health_compliance.dental_last_date).toBe("2026-04-15");
    expect(result.health_compliance.dental_next_due).toBe("2026-10-15");
  });

  it("marks dental as not current when older than 365 days", () => {
    const result = computeChildHealthIntelligence(baseInput({
      dental_records: [makeDental({ date: "2024-12-01", next_due: "2025-06-01" })],
    }));
    expect(result.health_compliance.dental_current).toBe(false);
    expect(result.concerns.some((c) => c.includes("Dental"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "dental")).toBe(true);
  });

  it("marks optician as current within 730 days (2 years)", () => {
    const result = computeChildHealthIntelligence(baseInput({
      opticians_records: [makeOptician({ date: "2025-01-01" })],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.optician_current).toBe(true);
  });

  it("marks optician as not current when older than 2 years", () => {
    const result = computeChildHealthIntelligence(baseInput({
      opticians_records: [makeOptician({ date: "2023-01-01" })],
    }));
    expect(result.health_compliance.optician_current).toBe(false);
    expect(result.concerns.some((c) => c.includes("Optician"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "optician")).toBe(true);
  });

  it("detects overdue immunisations", () => {
    const result = computeChildHealthIntelligence(baseInput({
      immunisations: [
        makeImmunisation({ id: "imm_1", status: "completed" }),
        makeImmunisation({ id: "imm_2", vaccine: "MMR", status: "overdue" }),
        makeImmunisation({ id: "imm_3", vaccine: "Flu", status: "overdue" }),
      ],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.immunisations_up_to_date).toBe(false);
    expect(result.health_compliance.immunisations_overdue).toBe(2);
    expect(result.concerns.some((c) => c.includes("overdue immunisation"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "immunisation")).toBe(true);
  });

  it("detects declined immunisations", () => {
    const result = computeChildHealthIntelligence(baseInput({
      immunisations: [makeImmunisation({ status: "declined" })],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.immunisations_declined).toBe(1);
  });

  it("marks immunisations up to date when all completed", () => {
    const result = computeChildHealthIntelligence(baseInput({
      immunisations: [
        makeImmunisation({ id: "imm_1" }),
        makeImmunisation({ id: "imm_2", vaccine: "Td/IPV" }),
      ],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.immunisations_up_to_date).toBe(true);
    expect(result.strengths.some((s) => s.includes("Immunisations"))).toBe(true);
  });

  it("generates positive insight when all health checks current", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
      immunisations: [makeImmunisation()],
    }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("All statutory health checks"))).toBe(true);
  });

  // ── CAMHS ─────────────────────────────────────────────────────────────

  it("recognises active CAMHS engagement", () => {
    const result = computeChildHealthIntelligence(baseInput({
      camhs: makeCamhs(),
      health_assessments: [makeAssessment()],
    }));
    expect(result.camhs_status.engaged).toBe(true);
    expect(result.camhs_status.attendance_rate).toBe(80);
    expect(result.camhs_status.next_appointment).toBe("2026-06-05");
    expect(result.strengths.some((s) => s.includes("CAMHS"))).toBe(true);
  });

  it("flags CAMHS waiting list", () => {
    const result = computeChildHealthIntelligence(baseInput({
      camhs: makeCamhs({ status: "waiting", sessions_attended: 0, sessions_offered: 0 }),
      health_assessments: [makeAssessment()],
    }));
    expect(result.camhs_status.waiting).toBe(true);
    expect(result.camhs_status.engaged).toBe(false);
    expect(result.concerns.some((c) => c.includes("CAMHS waiting"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "camhs")).toBe(true);
  });

  it("flags low CAMHS attendance", () => {
    const result = computeChildHealthIntelligence(baseInput({
      camhs: makeCamhs({ sessions_attended: 2, sessions_offered: 10, engagement_level: "poor" }),
      health_assessments: [makeAssessment()],
    }));
    expect(result.camhs_status.attendance_rate).toBe(20);
    expect(result.concerns.some((c) => c.includes("CAMHS attendance"))).toBe(true);
  });

  it("handles null CAMHS gracefully", () => {
    const result = computeChildHealthIntelligence(baseInput());
    expect(result.camhs_status.engaged).toBe(false);
    expect(result.camhs_status.status).toBeNull();
    expect(result.camhs_status.waiting).toBe(false);
  });

  // ── Wellbeing trajectory ──────────────────────────────────────────────

  it("detects improving mood trend", () => {
    const checkIns = [
      // Older period (31-60 days ago) — lower mood
      makeCheckIn({ id: "mh_1", date: "2026-04-10", overall_mood: 2, anxiety_level: 4, sleep_quality: 2 }),
      makeCheckIn({ id: "mh_2", date: "2026-04-15", overall_mood: 2, anxiety_level: 3, sleep_quality: 2 }),
      // Recent period (0-30 days) — higher mood
      makeCheckIn({ id: "mh_3", date: "2026-05-10", overall_mood: 4, anxiety_level: 2, sleep_quality: 4 }),
      makeCheckIn({ id: "mh_4", date: "2026-05-20", overall_mood: 4, anxiety_level: 2, sleep_quality: 4 }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.mood_trend).toBe("improving");
    expect(result.strengths.some((s) => s.includes("mood") && s.includes("improving"))).toBe(true);
  });

  it("detects declining mood trend", () => {
    const checkIns = [
      makeCheckIn({ id: "mh_1", date: "2026-04-10", overall_mood: 4, anxiety_level: 2, sleep_quality: 4 }),
      makeCheckIn({ id: "mh_2", date: "2026-04-15", overall_mood: 4, anxiety_level: 2, sleep_quality: 4 }),
      makeCheckIn({ id: "mh_3", date: "2026-05-10", overall_mood: 2, anxiety_level: 4, sleep_quality: 2 }),
      makeCheckIn({ id: "mh_4", date: "2026-05-20", overall_mood: 2, anxiety_level: 4, sleep_quality: 2 }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.mood_trend).toBe("declining");
    expect(result.concerns.some((c) => c.includes("mood") && c.includes("declining"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "wellbeing")).toBe(true);
  });

  it("returns insufficient_data for mood trend with fewer than 3 check-ins", () => {
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: [
        makeCheckIn({ id: "mh_1", date: "2026-05-20" }),
        makeCheckIn({ id: "mh_2", date: "2026-05-18" }),
      ],
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.mood_trend).toBe("insufficient_data");
  });

  it("computes average mood, anxiety, and sleep", () => {
    const checkIns = [
      makeCheckIn({ id: "mh_1", date: "2026-05-20", overall_mood: 3, anxiety_level: 2, sleep_quality: 4 }),
      makeCheckIn({ id: "mh_2", date: "2026-05-18", overall_mood: 5, anxiety_level: 4, sleep_quality: 2 }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.avg_mood).toBe(4);
    expect(result.wellbeing_trajectory.avg_anxiety).toBe(3);
    expect(result.wellbeing_trajectory.avg_sleep).toBe(3);
    expect(result.wellbeing_trajectory.data_points).toBe(2);
  });

  it("flags persistent high anxiety", () => {
    const checkIns = [
      makeCheckIn({ id: "mh_1", date: "2026-05-20", overall_mood: 3, anxiety_level: 4, sleep_quality: 3 }),
      makeCheckIn({ id: "mh_2", date: "2026-05-18", overall_mood: 3, anxiety_level: 5, sleep_quality: 3 }),
      makeCheckIn({ id: "mh_3", date: "2026-05-15", overall_mood: 3, anxiety_level: 4, sleep_quality: 3 }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.avg_anxiety).toBeGreaterThan(3.5);
    expect(result.concerns.some((c) => c.includes("anxiety"))).toBe(true);
  });

  it("collects recent concerns from check-ins", () => {
    const checkIns = [
      makeCheckIn({ id: "mh_1", date: "2026-05-20", concerns: ["nightmares", "homesickness"] }),
      makeCheckIn({ id: "mh_2", date: "2026-05-18", concerns: ["nightmares", "anger"] }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.wellbeing_trajectory.recent_concerns).toContain("nightmares");
    expect(result.wellbeing_trajectory.recent_concerns).toContain("homesickness");
    expect(result.wellbeing_trajectory.recent_concerns).toContain("anger");
  });

  // ── Appointment analysis ──────────────────────────────────────────────

  it("computes appointment attendance rate", () => {
    const appointments = [
      makeAppointment({ id: "ap1", date: "2026-05-10", attended: true }),
      makeAppointment({ id: "ap2", date: "2026-05-05", attended: true }),
      makeAppointment({ id: "ap3", date: "2026-04-20", attended: false, rescheduled: false }),
      makeAppointment({ id: "ap4", date: "2026-04-10", attended: false, rescheduled: true }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      appointments,
      health_assessments: [makeAssessment()],
    }));
    expect(result.appointment_analysis.total_90d).toBe(4);
    expect(result.appointment_analysis.attended_rate).toBe(50);
    expect(result.appointment_analysis.dna_count).toBe(1);
    expect(result.appointment_analysis.rescheduled_count).toBe(1);
  });

  it("flags multiple DNAs", () => {
    const appointments = [
      makeAppointment({ id: "ap1", date: "2026-05-10", attended: false }),
      makeAppointment({ id: "ap2", date: "2026-05-05", attended: false }),
      makeAppointment({ id: "ap3", date: "2026-04-20", attended: true }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      appointments,
      health_assessments: [makeAssessment()],
    }));
    expect(result.appointment_analysis.dna_count).toBe(2);
    expect(result.concerns.some((c) => c.includes("missed health appointments"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "appointments")).toBe(true);
  });

  it("gives strength for 100% attendance", () => {
    const appointments = [
      makeAppointment({ id: "ap1", date: "2026-05-10", attended: true }),
      makeAppointment({ id: "ap2", date: "2026-05-05", attended: true }),
      makeAppointment({ id: "ap3", date: "2026-04-20", attended: true }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      appointments,
      health_assessments: [makeAssessment()],
    }));
    expect(result.appointment_analysis.attended_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("appointments attended"))).toBe(true);
  });

  // ── Health score & status ─────────────────────────────────────────────

  it("scores excellent for comprehensive compliant health", () => {
    const meds = [makeMed()];
    const admins = Array.from({ length: 20 }, (_, i) =>
      makeAdmin({ id: `a_${i}`, date: `2026-05-${String(6 + (i % 20)).padStart(2, "0")}`, witnessed: true }),
    );
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
      immunisations: [makeImmunisation()],
      camhs: makeCamhs(),
      mental_health_check_ins: [
        makeCheckIn({ id: "mh_1", date: "2026-04-10", overall_mood: 4 }),
        makeCheckIn({ id: "mh_2", date: "2026-04-20", overall_mood: 4 }),
        makeCheckIn({ id: "mh_3", date: "2026-05-10", overall_mood: 5 }),
        makeCheckIn({ id: "mh_4", date: "2026-05-20", overall_mood: 5 }),
      ],
      appointments: [
        makeAppointment({ id: "ap1", date: "2026-05-10" }),
        makeAppointment({ id: "ap2", date: "2026-04-20" }),
        makeAppointment({ id: "ap3", date: "2026-04-10" }),
      ],
    }));
    expect(result.health_status).toBe("excellent");
    expect(result.health_score).toBeGreaterThanOrEqual(80);
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("scores critical for multiple health failures", () => {
    const result = computeChildHealthIntelligence(baseInput({
      medications: [makeMed()],
      medication_administrations: [
        makeAdmin({ id: "a1", status: "refused", date: "2026-05-20" }),
        makeAdmin({ id: "a2", status: "missed", date: "2026-05-19" }),
        makeAdmin({ id: "a3", status: "refused", date: "2026-05-18" }),
        makeAdmin({ id: "a4", status: "missed", date: "2026-05-17" }),
        makeAdmin({ id: "a5", status: "refused", date: "2026-05-16" }),
      ],
      immunisations: [
        makeImmunisation({ id: "imm_1", status: "overdue" }),
        makeImmunisation({ id: "imm_2", status: "overdue", vaccine: "MMR" }),
      ],
      appointments: [
        makeAppointment({ id: "ap1", date: "2026-05-10", attended: false }),
        makeAppointment({ id: "ap2", date: "2026-05-05", attended: false }),
      ],
    }));
    expect(result.health_status).toBe("critical");
    expect(result.health_score).toBeLessThan(35);
    expect(result.insights.some((i) => i.severity === "critical" && i.text.includes("critical"))).toBe(true);
  });

  it("clamps score between 0 and 100", () => {
    // Extremely positive — should not exceed 100
    const resultGood = computeChildHealthIntelligence(baseInput({
      medications: [makeMed()],
      medication_administrations: Array.from({ length: 30 }, (_, i) =>
        makeAdmin({ id: `a_${i}`, date: `2026-05-${String(1 + (i % 26)).padStart(2, "0")}`, witnessed: true }),
      ),
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
      immunisations: [makeImmunisation()],
      camhs: makeCamhs(),
      mental_health_check_ins: [
        makeCheckIn({ id: "mh1", date: "2026-04-10", overall_mood: 5 }),
        makeCheckIn({ id: "mh2", date: "2026-04-20", overall_mood: 5 }),
        makeCheckIn({ id: "mh3", date: "2026-05-10", overall_mood: 5 }),
        makeCheckIn({ id: "mh4", date: "2026-05-20", overall_mood: 5, sleep_quality: 5 }),
      ],
      appointments: [
        makeAppointment({ id: "ap1", date: "2026-05-10" }),
        makeAppointment({ id: "ap2", date: "2026-04-20" }),
        makeAppointment({ id: "ap3", date: "2026-04-10" }),
      ],
    }));
    expect(resultGood.health_score).toBeLessThanOrEqual(100);
    expect(resultGood.health_score).toBeGreaterThanOrEqual(0);
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes medication info in headline when meds active", () => {
    const result = computeChildHealthIntelligence(baseInput({
      medications: [makeMed()],
      medication_administrations: [makeAdmin()],
      health_assessments: [makeAssessment()],
    }));
    expect(result.headline).toContain("1 active medication");
    expect(result.headline).toContain("compliance");
  });

  it("includes overdue health assessment in headline", () => {
    const result = computeChildHealthIntelligence(baseInput());
    expect(result.headline).toContain("health assessment overdue");
  });

  it("includes CAMHS waiting in headline", () => {
    const result = computeChildHealthIntelligence(baseInput({
      camhs: makeCamhs({ status: "waiting" }),
      health_assessments: [makeAssessment()],
    }));
    expect(result.headline).toContain("CAMHS waiting list");
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  it("generates critical insight for very low medication compliance", () => {
    const meds = [makeMed()];
    const admins = [
      makeAdmin({ id: "a1", status: "refused", date: "2026-05-20" }),
      makeAdmin({ id: "a2", status: "missed", date: "2026-05-19" }),
      makeAdmin({ id: "a3", status: "given", date: "2026-05-18" }),
      makeAdmin({ id: "a4", status: "refused", date: "2026-05-17" }),
      makeAdmin({ id: "a5", status: "missed", date: "2026-05-16" }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.medication_compliance.given_rate).toBeLessThan(70);
    expect(result.insights.some((i) => i.severity === "critical" && i.text.includes("compliance below 70%"))).toBe(true);
  });

  it("generates warning insight for overdue assessment + CAMHS waiting", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment({ date: "2024-01-01" })],
      camhs: makeCamhs({ status: "waiting", sessions_attended: 0, sessions_offered: 0 }),
    }));
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("dual health gap"))).toBe(true);
  });

  it("generates warning for declining mood + high anxiety", () => {
    const checkIns = [
      makeCheckIn({ id: "mh_1", date: "2026-04-10", overall_mood: 4, anxiety_level: 3 }),
      makeCheckIn({ id: "mh_2", date: "2026-04-15", overall_mood: 4, anxiety_level: 3 }),
      makeCheckIn({ id: "mh_3", date: "2026-05-10", overall_mood: 2, anxiety_level: 4 }),
      makeCheckIn({ id: "mh_4", date: "2026-05-20", overall_mood: 2, anxiety_level: 4 }),
    ];
    const result = computeChildHealthIntelligence(baseInput({
      mental_health_check_ins: checkIns,
      health_assessments: [makeAssessment()],
    }));
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("Declining mood") && i.text.includes("anxiety"))).toBe(true);
  });

  it("generates positive insight for outstanding medication management", () => {
    const meds = [makeMed()];
    const admins = Array.from({ length: 20 }, (_, i) =>
      makeAdmin({ id: `a_${i}`, date: `2026-05-${String(6 + (i % 20)).padStart(2, "0")}`, witnessed: true }),
    );
    const result = computeChildHealthIntelligence(baseInput({
      medications: meds,
      medication_administrations: admins,
      health_assessments: [makeAssessment()],
    }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("Outstanding medication management"))).toBe(true);
  });

  it("generates positive CAMHS insight", () => {
    const result = computeChildHealthIntelligence(baseInput({
      camhs: makeCamhs({ sessions_attended: 9, sessions_offered: 10 }),
      health_assessments: [makeAssessment()],
    }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("CAMHS engagement"))).toBe(true);
  });

  // ── Empty input ───────────────────────────────────────────────────────

  it("handles empty input without crashing", () => {
    const result = computeChildHealthIntelligence(baseInput());
    expect(result.health_status).toBeDefined();
    expect(result.health_score).toBeGreaterThanOrEqual(0);
    expect(result.medication_compliance.active_medications).toBe(0);
    expect(result.health_compliance.health_assessment_current).toBe(false);
    expect(result.camhs_status.engaged).toBe(false);
    expect(result.wellbeing_trajectory.data_points).toBe(0);
    expect(result.appointment_analysis.total_90d).toBe(0);
  });

  // ── Recommendation ordering ───────────────────────────────────────────

  it("orders recommendations by urgency (immediate first)", () => {
    const result = computeChildHealthIntelligence(baseInput({
      // No health assessment → immediate
      medications: [makeMed()],
      medication_administrations: [
        makeAdmin({ id: "a1", status: "refused", date: "2026-05-20" }),
        makeAdmin({ id: "a2", status: "refused", date: "2026-05-19" }),
        makeAdmin({ id: "a3", status: "missed", date: "2026-05-18" }),
      ],
      // No dental → soon
      opticians_records: [makeOptician({ date: "2023-01-01" })],
    }));
    expect(result.recommendations.length).toBeGreaterThan(0);
    const urgencies = result.recommendations.map((r) => r.urgency);
    const order = { immediate: 0, soon: 1, planned: 2 };
    for (let i = 1; i < urgencies.length; i++) {
      expect(order[urgencies[i]]).toBeGreaterThanOrEqual(order[urgencies[i - 1]]);
    }
  });

  // ── Dental & optician use most recent record ──────────────────────────

  it("uses the most recent dental record for currency check", () => {
    const result = computeChildHealthIntelligence(baseInput({
      dental_records: [
        makeDental({ id: "d1", date: "2023-01-01" }),
        makeDental({ id: "d2", date: "2026-05-01" }),
      ],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.dental_current).toBe(true);
    expect(result.health_compliance.dental_last_date).toBe("2026-05-01");
  });

  it("uses the most recent optician record for currency check", () => {
    const result = computeChildHealthIntelligence(baseInput({
      opticians_records: [
        makeOptician({ id: "o1", date: "2022-01-01" }),
        makeOptician({ id: "o2", date: "2025-12-01" }),
      ],
      health_assessments: [makeAssessment()],
    }));
    expect(result.health_compliance.optician_current).toBe(true);
    expect(result.health_compliance.optician_last_date).toBe("2025-12-01");
  });

  // ── Dental & Optician strengths combined ──────────────────────────────

  it("generates strength when both dental and optician are current", () => {
    const result = computeChildHealthIntelligence(baseInput({
      health_assessments: [makeAssessment()],
      dental_records: [makeDental()],
      opticians_records: [makeOptician()],
    }));
    expect(result.strengths.some((s) => s.includes("Dental and optician"))).toBe(true);
  });
});
