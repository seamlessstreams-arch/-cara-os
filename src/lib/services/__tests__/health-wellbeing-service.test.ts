// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH & WELLBEING SERVICE TESTS
// Pure-function tests for health compliance, wellbeing trends, child health
// summaries, and SDQ classification. CHR 2015 Reg 23 (health and wellbeing).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../health-wellbeing-service";
import {
  APPOINTMENT_TYPES,
  WELLBEING_DIMENSIONS,
  SDQ_BANDS,
  IMMUNISATION_STATUS,
} from "../health-wellbeing-service";
import type {
  HealthAppointment,
  WellbeingAssessment,
  HealthProfile,
} from "../health-wellbeing-service";

const {
  computeHealthCompliance,
  computeWellbeingTrend,
  computeChildHealthSummary,
  classifySDQScores,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal health appointment for compliance tests. */
function appointment(overrides?: Partial<HealthAppointment>): HealthAppointment {
  return {
    id: overrides?.id ?? "appt-1",
    home_id: overrides?.home_id ?? "home-1",
    child_id: overrides?.child_id ?? "child-1",
    appointment_type: overrides?.appointment_type ?? "gp",
    provider_name: overrides?.provider_name ?? "Dr Smith",
    appointment_date: overrides?.appointment_date ?? "2026-04-10",
    outcome: overrides?.outcome ?? "attended",
    notes: "notes" in (overrides ?? {}) ? overrides!.notes : null,
    follow_up_required: overrides?.follow_up_required ?? false,
    follow_up_date: "follow_up_date" in (overrides ?? {}) ? overrides!.follow_up_date : null,
    consent_obtained: overrides?.consent_obtained ?? true,
    accompanied_by: "accompanied_by" in (overrides ?? {}) ? overrides!.accompanied_by : null,
    created_at: overrides?.created_at ?? "2026-04-10T08:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-04-10T08:00:00Z",
  };
}

/** Build a minimal wellbeing assessment for trend tests. */
function assessment(overrides?: Partial<WellbeingAssessment>): WellbeingAssessment {
  return {
    id: overrides?.id ?? "assess-1",
    home_id: overrides?.home_id ?? "home-1",
    child_id: overrides?.child_id ?? "child-1",
    assessment_date: overrides?.assessment_date ?? "2026-04-10",
    assessment_type: overrides?.assessment_type ?? "informal",
    sdq_scores: "sdq_scores" in (overrides ?? {}) ? overrides!.sdq_scores : null,
    overall_wellbeing: overrides?.overall_wellbeing ?? 7,
    sleep_quality: "sleep_quality" in (overrides ?? {}) ? overrides!.sleep_quality : null,
    appetite: "appetite" in (overrides ?? {}) ? overrides!.appetite : null,
    self_care: "self_care" in (overrides ?? {}) ? overrides!.self_care : null,
    notes: "notes" in (overrides ?? {}) ? overrides!.notes : null,
    assessed_by: overrides?.assessed_by ?? "staff-1",
    created_at: overrides?.created_at ?? "2026-04-10T08:00:00Z",
  };
}

/** Build a minimal health profile for compliance and summary tests. */
function profile(overrides?: Partial<HealthProfile>): HealthProfile {
  return {
    id: overrides?.id ?? "profile-1",
    home_id: overrides?.home_id ?? "home-1",
    child_id: overrides?.child_id ?? "child-1",
    immunisation_status: overrides?.immunisation_status ?? "up_to_date",
    allergies: overrides?.allergies ?? [],
    dietary_requirements: overrides?.dietary_requirements ?? [],
    registered_gp: overrides?.registered_gp ?? "Dr Smith",
    registered_dentist: overrides?.registered_dentist ?? "Mr Jones",
    registered_optician: overrides?.registered_optician ?? "Specsavers",
    camhs_status: overrides?.camhs_status ?? "none",
    last_health_assessment: "last_health_assessment" in (overrides ?? {}) ? overrides!.last_health_assessment : null,
    next_health_assessment: "next_health_assessment" in (overrides ?? {}) ? overrides!.next_health_assessment : null,
    health_conditions: overrides?.health_conditions ?? [],
    created_at: overrides?.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

/** Helper: date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Helper: date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ── classifySDQScores ──────────────────────────────────────────────────────

describe("classifySDQScores", () => {
  it("classifies all-normal scores correctly", () => {
    const result = classifySDQScores({
      emotional_symptoms: 2,
      conduct_problems: 1,
      hyperactivity: 4,
      peer_problems: 1,
      prosocial: 8,
      total_difficulties: 8,
    });
    expect(result.total_difficulties).toBe("normal");
    expect(result.emotional_symptoms).toBe("normal");
    expect(result.conduct_problems).toBe("normal");
    expect(result.hyperactivity).toBe("normal");
    expect(result.peer_problems).toBe("normal");
    expect(result.prosocial).toBe("normal");
  });

  it("classifies all-abnormal scores correctly", () => {
    const result = classifySDQScores({
      emotional_symptoms: 8,
      conduct_problems: 7,
      hyperactivity: 9,
      peer_problems: 6,
      prosocial: 2,
      total_difficulties: 30,
    });
    expect(result.total_difficulties).toBe("abnormal");
    expect(result.emotional_symptoms).toBe("abnormal");
    expect(result.conduct_problems).toBe("abnormal");
    expect(result.hyperactivity).toBe("abnormal");
    expect(result.peer_problems).toBe("abnormal");
    expect(result.prosocial).toBe("abnormal");
  });

  it("classifies borderline total_difficulties (14-16)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 0,
      hyperactivity: 0,
      peer_problems: 0,
      prosocial: 10,
      total_difficulties: 15,
    });
    expect(result.total_difficulties).toBe("borderline");
  });

  it("classifies borderline emotional_symptoms (4)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 4,
      conduct_problems: 0,
      hyperactivity: 0,
      peer_problems: 0,
      prosocial: 10,
      total_difficulties: 0,
    });
    expect(result.emotional_symptoms).toBe("borderline");
  });

  it("classifies borderline conduct_problems (3)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 3,
      hyperactivity: 0,
      peer_problems: 0,
      prosocial: 10,
      total_difficulties: 0,
    });
    expect(result.conduct_problems).toBe("borderline");
  });

  it("classifies borderline hyperactivity (6)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 0,
      hyperactivity: 6,
      peer_problems: 0,
      prosocial: 10,
      total_difficulties: 0,
    });
    expect(result.hyperactivity).toBe("borderline");
  });

  it("classifies borderline peer_problems (3)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 0,
      hyperactivity: 0,
      peer_problems: 3,
      prosocial: 10,
      total_difficulties: 0,
    });
    expect(result.peer_problems).toBe("borderline");
  });

  it("classifies borderline prosocial (5)", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 0,
      hyperactivity: 0,
      peer_problems: 0,
      prosocial: 5,
      total_difficulties: 0,
    });
    expect(result.prosocial).toBe("borderline");
  });

  it("handles boundary between normal and borderline for total_difficulties", () => {
    // 13 is upper normal, 14 is lower borderline
    const normal = classifySDQScores({
      emotional_symptoms: 0, conduct_problems: 0, hyperactivity: 0,
      peer_problems: 0, prosocial: 10, total_difficulties: 13,
    });
    const borderline = classifySDQScores({
      emotional_symptoms: 0, conduct_problems: 0, hyperactivity: 0,
      peer_problems: 0, prosocial: 10, total_difficulties: 14,
    });
    expect(normal.total_difficulties).toBe("normal");
    expect(borderline.total_difficulties).toBe("borderline");
  });

  it("handles boundary between borderline and abnormal for total_difficulties", () => {
    // 16 is upper borderline, 17 is lower abnormal
    const borderline = classifySDQScores({
      emotional_symptoms: 0, conduct_problems: 0, hyperactivity: 0,
      peer_problems: 0, prosocial: 10, total_difficulties: 16,
    });
    const abnormal = classifySDQScores({
      emotional_symptoms: 0, conduct_problems: 0, hyperactivity: 0,
      peer_problems: 0, prosocial: 10, total_difficulties: 17,
    });
    expect(borderline.total_difficulties).toBe("borderline");
    expect(abnormal.total_difficulties).toBe("abnormal");
  });

  it("classifies zero scores correctly", () => {
    const result = classifySDQScores({
      emotional_symptoms: 0,
      conduct_problems: 0,
      hyperactivity: 0,
      peer_problems: 0,
      prosocial: 0,
      total_difficulties: 0,
    });
    expect(result.total_difficulties).toBe("normal");
    expect(result.emotional_symptoms).toBe("normal");
    expect(result.conduct_problems).toBe("normal");
    expect(result.hyperactivity).toBe("normal");
    expect(result.peer_problems).toBe("normal");
    // prosocial 0 is abnormal (abnormal range 0-4)
    expect(result.prosocial).toBe("abnormal");
  });

  it("classifies a mixed set of subscale scores", () => {
    const result = classifySDQScores({
      emotional_symptoms: 4,  // borderline
      conduct_problems: 5,    // abnormal
      hyperactivity: 3,       // normal
      peer_problems: 3,       // borderline
      prosocial: 7,           // normal
      total_difficulties: 15, // borderline
    });
    expect(result.emotional_symptoms).toBe("borderline");
    expect(result.conduct_problems).toBe("abnormal");
    expect(result.hyperactivity).toBe("normal");
    expect(result.peer_problems).toBe("borderline");
    expect(result.prosocial).toBe("normal");
    expect(result.total_difficulties).toBe("borderline");
  });
});

// ── computeHealthCompliance ────────────────────────────────────────────────

describe("computeHealthCompliance", () => {
  it("returns zeroed metrics for empty profiles and appointments", () => {
    const result = computeHealthCompliance([], []);
    expect(result.total_children).toBe(0);
    expect(result.immunisation_up_to_date).toBe(0);
    expect(result.dental_up_to_date).toBe(0);
    expect(result.optician_up_to_date).toBe(0);
    expect(result.health_assessment_current).toBe(0);
    expect(result.camhs_active).toBe(0);
    expect(result.overdue_appointments).toEqual([]);
    expect(result.dna_rate).toBe(0);
  });

  it("counts total_children from profiles", () => {
    const profiles = [
      profile({ id: "p1", child_id: "c1" }),
      profile({ id: "p2", child_id: "c2" }),
      profile({ id: "p3", child_id: "c3" }),
    ];
    const result = computeHealthCompliance(profiles, []);
    expect(result.total_children).toBe(3);
  });

  it("counts immunisation_up_to_date correctly", () => {
    const profiles = [
      profile({ id: "p1", child_id: "c1", immunisation_status: "up_to_date" }),
      profile({ id: "p2", child_id: "c2", immunisation_status: "partially_complete" }),
      profile({ id: "p3", child_id: "c3", immunisation_status: "up_to_date" }),
    ];
    const result = computeHealthCompliance(profiles, []);
    expect(result.immunisation_up_to_date).toBe(2);
  });

  it("counts dental_up_to_date for dentist attended within 26 weeks", () => {
    const recentDate = daysAgo(30); // ~4 weeks ago, within 26w
    const profiles = [
      profile({ id: "p1", child_id: "c1" }),
      profile({ id: "p2", child_id: "c2" }),
    ];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: recentDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.dental_up_to_date).toBe(1);
  });

  it("does not count dental_up_to_date for dentist beyond 26 weeks", () => {
    const oldDate = daysAgo(200); // well beyond 26 weeks (182 days)
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: oldDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.dental_up_to_date).toBe(0);
  });

  it("counts optician_up_to_date for optician attended within 52 weeks", () => {
    const recentDate = daysAgo(100); // ~14 weeks ago, within 52w
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "optician", outcome: "attended", appointment_date: recentDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.optician_up_to_date).toBe(1);
  });

  it("does not count optician_up_to_date for optician beyond 52 weeks", () => {
    const oldDate = daysAgo(400); // well beyond 52 weeks (364 days)
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "optician", outcome: "attended", appointment_date: oldDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.optician_up_to_date).toBe(0);
  });

  it("only counts attended appointments for dental/optician compliance", () => {
    const recentDate = daysAgo(10);
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "cancelled", appointment_date: recentDate }),
      appointment({ id: "a2", child_id: "c1", appointment_type: "optician", outcome: "dna", appointment_date: recentDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.dental_up_to_date).toBe(0);
    expect(result.optician_up_to_date).toBe(0);
  });

  it("counts health_assessment_current when next_health_assessment is in the future", () => {
    const futureDate = daysFromNow(30);
    const profiles = [
      profile({ id: "p1", child_id: "c1", next_health_assessment: futureDate }),
      profile({ id: "p2", child_id: "c2", next_health_assessment: null }),
    ];
    const result = computeHealthCompliance(profiles, []);
    expect(result.health_assessment_current).toBe(1);
  });

  it("does not count health_assessment_current when date is in the past", () => {
    const pastDate = daysAgo(10);
    const profiles = [
      profile({ id: "p1", child_id: "c1", next_health_assessment: pastDate }),
    ];
    const result = computeHealthCompliance(profiles, []);
    expect(result.health_assessment_current).toBe(0);
  });

  it("counts camhs_active correctly", () => {
    const profiles = [
      profile({ id: "p1", child_id: "c1", camhs_status: "active" }),
      profile({ id: "p2", child_id: "c2", camhs_status: "referred" }),
      profile({ id: "p3", child_id: "c3", camhs_status: "active" }),
      profile({ id: "p4", child_id: "c4", camhs_status: "discharged" }),
    ];
    const result = computeHealthCompliance(profiles, []);
    expect(result.camhs_active).toBe(2);
  });

  it("computes dna_rate as percentage with one decimal place", () => {
    const appointments = [
      appointment({ id: "a1", outcome: "attended" }),
      appointment({ id: "a2", outcome: "dna" }),
      appointment({ id: "a3", outcome: "attended" }),
    ];
    // 1/3 * 100 = 33.3
    const result = computeHealthCompliance([], appointments);
    expect(result.dna_rate).toBe(33.3);
  });

  it("returns dna_rate of 0 when no appointments exist", () => {
    const result = computeHealthCompliance([], []);
    expect(result.dna_rate).toBe(0);
  });

  it("flags overdue dentist when no dentist record exists", () => {
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const result = computeHealthCompliance(profiles, []);
    const dentistOverdue = result.overdue_appointments.filter((o) => o.type === "dentist");
    expect(dentistOverdue).toHaveLength(1);
    expect(dentistOverdue[0].child_id).toBe("c1");
    expect(dentistOverdue[0].last_date).toBeNull();
    expect(dentistOverdue[0].days_overdue).toBe(0);
  });

  it("flags overdue optician when no optician record exists", () => {
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const result = computeHealthCompliance(profiles, []);
    const opticianOverdue = result.overdue_appointments.filter((o) => o.type === "optician");
    expect(opticianOverdue).toHaveLength(1);
    expect(opticianOverdue[0].last_date).toBeNull();
  });

  it("flags overdue dentist when last visit is beyond 26 weeks", () => {
    const oldDate = daysAgo(200);
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: oldDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    const dentistOverdue = result.overdue_appointments.filter((o) => o.type === "dentist");
    expect(dentistOverdue).toHaveLength(1);
    expect(dentistOverdue[0].last_date).toBe(oldDate);
    expect(dentistOverdue[0].days_overdue).toBeGreaterThan(0);
  });

  it("does not flag dentist as overdue when within 26 weeks", () => {
    const recentDate = daysAgo(30);
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: recentDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    const dentistOverdue = result.overdue_appointments.filter((o) => o.type === "dentist");
    expect(dentistOverdue).toEqual([]);
  });

  it("uses the most recent attended appointment for each type per child", () => {
    const oldDate = daysAgo(300);
    const recentDate = daysAgo(10);
    const profiles = [profile({ id: "p1", child_id: "c1" })];
    const appointments = [
      appointment({ id: "a1", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: oldDate }),
      appointment({ id: "a2", child_id: "c1", appointment_type: "dentist", outcome: "attended", appointment_date: recentDate }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    expect(result.dental_up_to_date).toBe(1);
    const dentistOverdue = result.overdue_appointments.filter((o) => o.type === "dentist");
    expect(dentistOverdue).toEqual([]);
  });
});

// ── computeWellbeingTrend ──────────────────────────────────────────────────

describe("computeWellbeingTrend", () => {
  it("returns zeroed metrics for empty assessments", () => {
    const result = computeWellbeingTrend([]);
    expect(result.latest_wellbeing).toBe(0);
    expect(result.trend).toBe("stable");
    expect(result.sdq_band).toBeNull();
    expect(result.avg_sleep).toBe(0);
    expect(result.avg_appetite).toBe(0);
    expect(result.assessment_count).toBe(0);
  });

  it("returns stable trend for a single assessment", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 7 }),
    ]);
    expect(result.latest_wellbeing).toBe(7);
    expect(result.trend).toBe("stable");
    expect(result.assessment_count).toBe(1);
  });

  it("returns latest_wellbeing from the last element in the array", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 3, assessment_date: "2026-01-01" }),
      assessment({ id: "a2", overall_wellbeing: 5, assessment_date: "2026-02-01" }),
      assessment({ id: "a3", overall_wellbeing: 9, assessment_date: "2026-03-01" }),
    ]);
    expect(result.latest_wellbeing).toBe(9);
  });

  it("detects improving trend when second half average > first half", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 3, assessment_date: "2026-01-01" }),
      assessment({ id: "a2", overall_wellbeing: 4, assessment_date: "2026-02-01" }),
      assessment({ id: "a3", overall_wellbeing: 7, assessment_date: "2026-03-01" }),
      assessment({ id: "a4", overall_wellbeing: 8, assessment_date: "2026-04-01" }),
    ]);
    // firstHalf [3,4] avg=3.5, secondHalf [7,8] avg=7.5
    expect(result.trend).toBe("improving");
  });

  it("detects declining trend when second half average < first half", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 8, assessment_date: "2026-01-01" }),
      assessment({ id: "a2", overall_wellbeing: 9, assessment_date: "2026-02-01" }),
      assessment({ id: "a3", overall_wellbeing: 3, assessment_date: "2026-03-01" }),
      assessment({ id: "a4", overall_wellbeing: 2, assessment_date: "2026-04-01" }),
    ]);
    // firstHalf [8,9] avg=8.5, secondHalf [3,2] avg=2.5
    expect(result.trend).toBe("declining");
  });

  it("detects stable trend when halves have equal averages", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 5, assessment_date: "2026-01-01" }),
      assessment({ id: "a2", overall_wellbeing: 5, assessment_date: "2026-02-01" }),
      assessment({ id: "a3", overall_wellbeing: 5, assessment_date: "2026-03-01" }),
      assessment({ id: "a4", overall_wellbeing: 5, assessment_date: "2026-04-01" }),
    ]);
    expect(result.trend).toBe("stable");
  });

  it("uses correct halving for odd-length arrays (first half is smaller)", () => {
    // 3 items: mid = floor(3/2) = 1, firstHalf = [0..0], secondHalf = [1..2]
    const result = computeWellbeingTrend([
      assessment({ id: "a1", overall_wellbeing: 2, assessment_date: "2026-01-01" }),
      assessment({ id: "a2", overall_wellbeing: 6, assessment_date: "2026-02-01" }),
      assessment({ id: "a3", overall_wellbeing: 8, assessment_date: "2026-03-01" }),
    ]);
    // firstHalf [2] avg=2, secondHalf [6,8] avg=7
    expect(result.trend).toBe("improving");
  });

  it("returns sdq_band from the most recent assessment with SDQ scores", () => {
    const result = computeWellbeingTrend([
      assessment({
        id: "a1",
        assessment_date: "2026-01-01",
        sdq_scores: {
          emotional_symptoms: 1, conduct_problems: 1, hyperactivity: 2,
          peer_problems: 1, prosocial: 8, total_difficulties: 5,
        },
      }),
      assessment({
        id: "a2",
        assessment_date: "2026-02-01",
        sdq_scores: {
          emotional_symptoms: 5, conduct_problems: 5, hyperactivity: 7,
          peer_problems: 5, prosocial: 2, total_difficulties: 22,
        },
      }),
    ]);
    // Most recent SDQ total_difficulties = 22 => abnormal (17-40)
    expect(result.sdq_band).toBe("abnormal");
  });

  it("returns sdq_band null when no assessments have SDQ scores", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", sdq_scores: null }),
      assessment({ id: "a2", sdq_scores: null }),
    ]);
    expect(result.sdq_band).toBeNull();
  });

  it("skips assessments without SDQ to find the most recent one that has it", () => {
    const result = computeWellbeingTrend([
      assessment({
        id: "a1",
        assessment_date: "2026-01-01",
        sdq_scores: {
          emotional_symptoms: 1, conduct_problems: 1, hyperactivity: 2,
          peer_problems: 1, prosocial: 8, total_difficulties: 5,
        },
      }),
      assessment({ id: "a2", assessment_date: "2026-02-01", sdq_scores: null }),
    ]);
    // Falls back to a1's SDQ: total_difficulties 5 => normal (0-13)
    expect(result.sdq_band).toBe("normal");
  });

  it("computes avg_sleep from non-null sleep_quality values (1 decimal)", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", sleep_quality: 3 }),
      assessment({ id: "a2", sleep_quality: 5 }),
      assessment({ id: "a3", sleep_quality: null }),
    ]);
    // (3 + 5) / 2 = 4.0
    expect(result.avg_sleep).toBe(4);
  });

  it("returns avg_sleep of 0 when all sleep values are null", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", sleep_quality: null }),
      assessment({ id: "a2", sleep_quality: null }),
    ]);
    expect(result.avg_sleep).toBe(0);
  });

  it("computes avg_appetite from non-null appetite values (1 decimal)", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", appetite: 2 }),
      assessment({ id: "a2", appetite: 4 }),
      assessment({ id: "a3", appetite: 3 }),
    ]);
    // (2 + 4 + 3) / 3 = 3.0
    expect(result.avg_appetite).toBe(3);
  });

  it("rounds avg_sleep and avg_appetite to 1 decimal place", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1", sleep_quality: 3, appetite: 2 }),
      assessment({ id: "a2", sleep_quality: 4, appetite: 3 }),
      assessment({ id: "a3", sleep_quality: 5, appetite: 5 }),
    ]);
    // sleep: (3+4+5)/3 = 4.0, appetite: (2+3+5)/3 = 3.333... => 3.3
    expect(result.avg_sleep).toBe(4);
    expect(result.avg_appetite).toBe(3.3);
  });

  it("returns correct assessment_count", () => {
    const result = computeWellbeingTrend([
      assessment({ id: "a1" }),
      assessment({ id: "a2" }),
      assessment({ id: "a3" }),
      assessment({ id: "a4" }),
      assessment({ id: "a5" }),
    ]);
    expect(result.assessment_count).toBe(5);
  });
});

// ── computeChildHealthSummary ──────────────────────────────────────────────

describe("computeChildHealthSummary", () => {
  it("returns basic profile fields correctly", () => {
    const p = profile({
      child_id: "c1",
      immunisation_status: "partially_complete",
      allergies: ["peanuts", "gluten"],
      health_conditions: ["asthma"],
      camhs_status: "referred",
    });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.child_id).toBe("c1");
    expect(result.immunisation_status).toBe("partially_complete");
    expect(result.allergy_count).toBe(2);
    expect(result.condition_count).toBe(1);
    expect(result.camhs_status).toBe("referred");
  });

  it("returns null for last_gp/dentist/optician when no attended appointments", () => {
    const result = computeChildHealthSummary(profile(), [], []);
    expect(result.last_gp_visit).toBeNull();
    expect(result.last_dentist_visit).toBeNull();
    expect(result.last_optician_visit).toBeNull();
  });

  it("finds the most recent attended appointment by type", () => {
    const appts = [
      appointment({ id: "a1", appointment_type: "gp", outcome: "attended", appointment_date: "2026-01-01" }),
      appointment({ id: "a2", appointment_type: "gp", outcome: "attended", appointment_date: "2026-03-15" }),
      appointment({ id: "a3", appointment_type: "gp", outcome: "cancelled", appointment_date: "2026-04-01" }),
      appointment({ id: "a4", appointment_type: "dentist", outcome: "attended", appointment_date: "2026-02-20" }),
      appointment({ id: "a5", appointment_type: "optician", outcome: "attended", appointment_date: "2026-01-10" }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.last_gp_visit).toBe("2026-03-15");
    expect(result.last_dentist_visit).toBe("2026-02-20");
    expect(result.last_optician_visit).toBe("2026-01-10");
  });

  it("ignores non-attended appointments for last visit dates", () => {
    const appts = [
      appointment({ id: "a1", appointment_type: "gp", outcome: "dna", appointment_date: "2026-04-01" }),
      appointment({ id: "a2", appointment_type: "gp", outcome: "cancelled", appointment_date: "2026-03-01" }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.last_gp_visit).toBeNull();
  });

  it("counts appointments in the last 30 days", () => {
    const recentDate = daysAgo(10);
    const oldDate = daysAgo(60);
    const appts = [
      appointment({ id: "a1", appointment_date: recentDate }),
      appointment({ id: "a2", appointment_date: recentDate }),
      appointment({ id: "a3", appointment_date: oldDate }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.appointments_30d).toBe(2);
  });

  it("returns 0 appointments_30d when no recent appointments", () => {
    const oldDate = daysAgo(60);
    const appts = [appointment({ id: "a1", appointment_date: oldDate })];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.appointments_30d).toBe(0);
  });

  it("counts dna_count from all appointments", () => {
    const appts = [
      appointment({ id: "a1", outcome: "dna" }),
      appointment({ id: "a2", outcome: "attended" }),
      appointment({ id: "a3", outcome: "dna" }),
      appointment({ id: "a4", outcome: "cancelled" }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.dna_count).toBe(2);
  });

  it("returns latest_wellbeing_score from the most recent assessment by date", () => {
    const assessments = [
      assessment({ id: "a1", assessment_date: "2026-01-01", overall_wellbeing: 4 }),
      assessment({ id: "a2", assessment_date: "2026-03-01", overall_wellbeing: 8 }),
      assessment({ id: "a3", assessment_date: "2026-02-01", overall_wellbeing: 6 }),
    ];
    const result = computeChildHealthSummary(profile(), [], assessments);
    // Most recent by assessment_date is a2 (2026-03-01)
    expect(result.latest_wellbeing_score).toBe(8);
  });

  it("returns latest_wellbeing_score of 0 when no assessments", () => {
    const result = computeChildHealthSummary(profile(), [], []);
    expect(result.latest_wellbeing_score).toBe(0);
  });

  it("flags immunisation_incomplete when status is not up_to_date", () => {
    const p = profile({ immunisation_status: "partially_complete" });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).toContain("immunisation_incomplete");
  });

  it("does not flag immunisation_incomplete when status is up_to_date", () => {
    const p = profile({ immunisation_status: "up_to_date" });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).not.toContain("immunisation_incomplete");
  });

  it("flags dental_overdue when no dentist visit exists", () => {
    const result = computeChildHealthSummary(profile(), [], []);
    expect(result.health_flags).toContain("dental_overdue");
  });

  it("flags dental_overdue when last dentist visit is beyond 26 weeks", () => {
    const oldDate = daysAgo(200);
    const appts = [
      appointment({ id: "a1", appointment_type: "dentist", outcome: "attended", appointment_date: oldDate }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.health_flags).toContain("dental_overdue");
  });

  it("does not flag dental_overdue when dentist visit is within 26 weeks", () => {
    const recentDate = daysAgo(30);
    const appts = [
      appointment({ id: "a1", appointment_type: "dentist", outcome: "attended", appointment_date: recentDate }),
    ];
    const result = computeChildHealthSummary(profile(), appts, []);
    expect(result.health_flags).not.toContain("dental_overdue");
  });

  it("flags camhs_referred when camhs_status is referred", () => {
    const p = profile({ camhs_status: "referred" });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).toContain("camhs_referred");
  });

  it("does not flag camhs_referred for active or none status", () => {
    const p1 = profile({ camhs_status: "active" });
    const p2 = profile({ camhs_status: "none" });
    const result1 = computeChildHealthSummary(p1, [], []);
    const result2 = computeChildHealthSummary(p2, [], []);
    expect(result1.health_flags).not.toContain("camhs_referred");
    expect(result2.health_flags).not.toContain("camhs_referred");
  });

  it("flags health_assessment_overdue when next_health_assessment is null", () => {
    const p = profile({ next_health_assessment: null });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).toContain("health_assessment_overdue");
  });

  it("flags health_assessment_overdue when next_health_assessment is in the past", () => {
    const pastDate = daysAgo(10);
    const p = profile({ next_health_assessment: pastDate });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).toContain("health_assessment_overdue");
  });

  it("does not flag health_assessment_overdue when next_health_assessment is in the future", () => {
    const futureDate = daysFromNow(30);
    const p = profile({ next_health_assessment: futureDate });
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).not.toContain("health_assessment_overdue");
  });

  it("accumulates multiple flags for a problematic profile", () => {
    const p = profile({
      immunisation_status: "unknown",
      camhs_status: "referred",
      next_health_assessment: null,
    });
    // No dentist appointment => dental_overdue
    const result = computeChildHealthSummary(p, [], []);
    expect(result.health_flags).toContain("immunisation_incomplete");
    expect(result.health_flags).toContain("dental_overdue");
    expect(result.health_flags).toContain("camhs_referred");
    expect(result.health_flags).toContain("health_assessment_overdue");
    expect(result.health_flags).toHaveLength(4);
  });
});

// ── APPOINTMENT_TYPES constant ─────────────────────────────────────────────

describe("APPOINTMENT_TYPES", () => {
  it("contains exactly 9 entries", () => {
    expect(APPOINTMENT_TYPES).toHaveLength(9);
  });

  it("each entry has type, label, and recommended_frequency_weeks fields", () => {
    for (const at of APPOINTMENT_TYPES) {
      expect(at).toHaveProperty("type");
      expect(at).toHaveProperty("label");
      expect(at).toHaveProperty("recommended_frequency_weeks");
    }
  });

  it("sets dentist recommended frequency to 26 weeks", () => {
    const dentist = APPOINTMENT_TYPES.find((t) => t.type === "dentist");
    expect(dentist?.recommended_frequency_weeks).toBe(26);
  });

  it("sets optician recommended frequency to 52 weeks", () => {
    const optician = APPOINTMENT_TYPES.find((t) => t.type === "optician");
    expect(optician?.recommended_frequency_weeks).toBe(52);
  });

  it("sets health_assessment recommended frequency to 52 weeks", () => {
    const ha = APPOINTMENT_TYPES.find((t) => t.type === "health_assessment");
    expect(ha?.recommended_frequency_weeks).toBe(52);
  });

  it("sets GP and CAMHS recommended frequency to 0 (as-needed)", () => {
    const gp = APPOINTMENT_TYPES.find((t) => t.type === "gp");
    const camhs = APPOINTMENT_TYPES.find((t) => t.type === "camhs");
    expect(gp?.recommended_frequency_weeks).toBe(0);
    expect(camhs?.recommended_frequency_weeks).toBe(0);
  });

  it("includes all expected type values", () => {
    const types = APPOINTMENT_TYPES.map((t) => t.type);
    expect(types).toEqual([
      "gp", "dentist", "optician", "camhs", "hospital",
      "specialist", "sexual_health", "immunisation", "health_assessment",
    ]);
  });

  it("has no duplicate type values", () => {
    const types = APPOINTMENT_TYPES.map((t) => t.type);
    const unique = new Set(types);
    expect(unique.size).toBe(types.length);
  });
});

// ── WELLBEING_DIMENSIONS constant ──────────────────────────────────────────

describe("WELLBEING_DIMENSIONS", () => {
  it("contains exactly 5 entries", () => {
    expect(WELLBEING_DIMENSIONS).toHaveLength(5);
  });

  it("each entry has dimension, label, and sdq_subscale fields", () => {
    for (const wd of WELLBEING_DIMENSIONS) {
      expect(wd).toHaveProperty("dimension");
      expect(wd).toHaveProperty("label");
      expect(wd).toHaveProperty("sdq_subscale");
    }
  });

  it("maps emotional dimension to emotional_symptoms subscale", () => {
    const emotional = WELLBEING_DIMENSIONS.find((d) => d.dimension === "emotional");
    expect(emotional?.sdq_subscale).toBe("emotional_symptoms");
  });

  it("maps behavioural dimension to conduct_problems subscale", () => {
    const behavioural = WELLBEING_DIMENSIONS.find((d) => d.dimension === "behavioural");
    expect(behavioural?.sdq_subscale).toBe("conduct_problems");
  });

  it("maps social dimension to peer_problems subscale", () => {
    const social = WELLBEING_DIMENSIONS.find((d) => d.dimension === "social");
    expect(social?.sdq_subscale).toBe("peer_problems");
  });

  it("maps hyperactivity dimension to hyperactivity subscale", () => {
    const hyper = WELLBEING_DIMENSIONS.find((d) => d.dimension === "hyperactivity");
    expect(hyper?.sdq_subscale).toBe("hyperactivity");
  });

  it("maps prosocial dimension to prosocial subscale", () => {
    const prosocial = WELLBEING_DIMENSIONS.find((d) => d.dimension === "prosocial");
    expect(prosocial?.sdq_subscale).toBe("prosocial");
  });

  it("has no duplicate dimension values", () => {
    const dims = WELLBEING_DIMENSIONS.map((d) => d.dimension);
    const unique = new Set(dims);
    expect(unique.size).toBe(dims.length);
  });
});

// ── SDQ_BANDS constant ─────────────────────────────────────────────────────

describe("SDQ_BANDS", () => {
  it("contains exactly 6 subscale entries", () => {
    expect(Object.keys(SDQ_BANDS)).toHaveLength(6);
  });

  it("includes all expected subscale keys", () => {
    const keys = Object.keys(SDQ_BANDS);
    expect(keys).toContain("total_difficulties");
    expect(keys).toContain("emotional_symptoms");
    expect(keys).toContain("conduct_problems");
    expect(keys).toContain("peer_problems");
    expect(keys).toContain("hyperactivity");
    expect(keys).toContain("prosocial");
  });

  it("each subscale has normal, borderline, and abnormal bands", () => {
    for (const [, bands] of Object.entries(SDQ_BANDS)) {
      expect(bands).toHaveProperty("normal");
      expect(bands).toHaveProperty("borderline");
      expect(bands).toHaveProperty("abnormal");
    }
  });

  it("each band is a two-element tuple", () => {
    for (const [, bands] of Object.entries(SDQ_BANDS)) {
      expect(bands.normal).toHaveLength(2);
      expect(bands.borderline).toHaveLength(2);
      expect(bands.abnormal).toHaveLength(2);
    }
  });

  it("total_difficulties bands are [0,13], [14,16], [17,40]", () => {
    expect(SDQ_BANDS.total_difficulties.normal).toEqual([0, 13]);
    expect(SDQ_BANDS.total_difficulties.borderline).toEqual([14, 16]);
    expect(SDQ_BANDS.total_difficulties.abnormal).toEqual([17, 40]);
  });

  it("prosocial has reversed scale (higher is better)", () => {
    // prosocial: normal [6,10], borderline [5,5], abnormal [0,4]
    expect(SDQ_BANDS.prosocial.normal[0]).toBeGreaterThan(SDQ_BANDS.prosocial.abnormal[1]);
  });

  it("emotional_symptoms bands are [0,3], [4,4], [5,10]", () => {
    expect(SDQ_BANDS.emotional_symptoms.normal).toEqual([0, 3]);
    expect(SDQ_BANDS.emotional_symptoms.borderline).toEqual([4, 4]);
    expect(SDQ_BANDS.emotional_symptoms.abnormal).toEqual([5, 10]);
  });

  it("hyperactivity normal range is wider than other subscales", () => {
    // hyperactivity normal [0,5] vs conduct_problems normal [0,2]
    const hyperNormalRange = SDQ_BANDS.hyperactivity.normal[1] - SDQ_BANDS.hyperactivity.normal[0];
    const conductNormalRange = SDQ_BANDS.conduct_problems.normal[1] - SDQ_BANDS.conduct_problems.normal[0];
    expect(hyperNormalRange).toBeGreaterThan(conductNormalRange);
  });
});

// ── IMMUNISATION_STATUS constant ───────────────────────────────────────────

describe("IMMUNISATION_STATUS", () => {
  it("contains exactly 5 statuses", () => {
    expect(IMMUNISATION_STATUS).toHaveLength(5);
  });

  it("includes up_to_date as the first status", () => {
    expect(IMMUNISATION_STATUS[0]).toBe("up_to_date");
  });

  it("includes all expected status values", () => {
    expect(IMMUNISATION_STATUS).toContain("up_to_date");
    expect(IMMUNISATION_STATUS).toContain("partially_complete");
    expect(IMMUNISATION_STATUS).toContain("unknown");
    expect(IMMUNISATION_STATUS).toContain("declined");
    expect(IMMUNISATION_STATUS).toContain("medical_exemption");
  });

  it("has no duplicate values", () => {
    const unique = new Set(IMMUNISATION_STATUS);
    expect(unique.size).toBe(IMMUNISATION_STATUS.length);
  });

  it("is a readonly tuple", () => {
    // Verify expected ordering
    expect(IMMUNISATION_STATUS).toEqual([
      "up_to_date",
      "partially_complete",
      "unknown",
      "declined",
      "medical_exemption",
    ]);
  });
});
