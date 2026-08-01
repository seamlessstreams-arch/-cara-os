import { describe, it, expect } from "vitest";
import {
  classifySDQScores,
  computeHealthCompliance,
  computeWellbeingTrend,
  computeChildHealthSummary,
  type HealthProfile,
  type HealthAppointment,
  type WellbeingAssessment,
} from "./health-wellbeing-service";

// ── Factories ────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<HealthProfile> = {}): HealthProfile {
  return {
    id: "profile-1",
    home_id: "home-1",
    child_id: "child-1",
    immunisation_status: "up_to_date",
    allergies: [],
    dietary_requirements: [],
    registered_gp: "Dr Smith",
    registered_dentist: "Mr Jones",
    registered_optician: "Mrs Brown",
    camhs_status: "none",
    last_health_assessment: "2025-01-01",
    next_health_assessment: "2027-01-01",
    health_conditions: [],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<HealthAppointment> = {}): HealthAppointment {
  return {
    id: "appt-1",
    home_id: "home-1",
    child_id: "child-1",
    appointment_type: "gp",
    provider_name: "Dr Smith",
    appointment_date: "2026-05-01",
    outcome: "attended",
    notes: null,
    follow_up_required: false,
    follow_up_date: null,
    consent_obtained: true,
    accompanied_by: "Key worker",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<WellbeingAssessment> = {}): WellbeingAssessment {
  return {
    id: "assess-1",
    home_id: "home-1",
    child_id: "child-1",
    assessment_date: "2026-05-01",
    assessment_type: "informal",
    sdq_scores: null,
    overall_wellbeing: 7,
    sleep_quality: 4,
    appetite: 4,
    self_care: 4,
    notes: null,
    assessed_by: "Staff A",
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── classifySDQScores ────────────────────────────────────────────────────

describe("classifySDQScores", () => {
  it("classifies all-normal scores correctly", () => {
    const result = classifySDQScores({
      emotional_symptoms: 2,
      conduct_problems: 1,
      hyperactivity: 4,
      peer_problems: 1,
      prosocial: 8,
      total_difficulties: 10,
    });
    expect(result.total_difficulties).toBe("normal");
    expect(result.emotional_symptoms).toBe("normal");
    expect(result.conduct_problems).toBe("normal");
    expect(result.hyperactivity).toBe("normal");
    expect(result.peer_problems).toBe("normal");
    expect(result.prosocial).toBe("normal");
  });

  it("classifies borderline scores correctly", () => {
    const result = classifySDQScores({
      emotional_symptoms: 4,
      conduct_problems: 3,
      hyperactivity: 6,
      peer_problems: 3,
      prosocial: 5,
      total_difficulties: 15,
    });
    expect(result.total_difficulties).toBe("borderline");
    expect(result.emotional_symptoms).toBe("borderline");
    expect(result.conduct_problems).toBe("borderline");
    expect(result.hyperactivity).toBe("borderline");
    expect(result.peer_problems).toBe("borderline");
    expect(result.prosocial).toBe("borderline");
  });

  it("classifies abnormal scores correctly", () => {
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
});

// ── computeHealthCompliance ──────────────────────────────────────────────

describe("computeHealthCompliance", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHealthCompliance([], []);
    expect(result.total_children).toBe(0);
    expect(result.immunisation_up_to_date).toBe(0);
    expect(result.dental_up_to_date).toBe(0);
    expect(result.optician_up_to_date).toBe(0);
    expect(result.health_assessment_current).toBe(0);
    expect(result.camhs_active).toBe(0);
    expect(result.overdue_appointments).toEqual([]);
    expect(result.dna_rate).toBeNull(); // fab-0.;
  });

  it("computes correct counts with populated data", () => {
    const profiles = [
      makeProfile({ child_id: "c1", immunisation_status: "up_to_date", camhs_status: "active" }),
      makeProfile({ child_id: "c2", immunisation_status: "partially_complete", camhs_status: "none" }),
    ];

    // Recent dentist for c1, recent optician for c1
    const appointments = [
      makeAppointment({ child_id: "c1", appointment_type: "dentist", appointment_date: "2026-05-01", outcome: "attended" }),
      makeAppointment({ child_id: "c1", appointment_type: "optician", appointment_date: "2026-01-01", outcome: "attended" }),
      makeAppointment({ child_id: "c2", appointment_type: "gp", appointment_date: "2026-04-01", outcome: "dna" }),
    ];

    const result = computeHealthCompliance(profiles, appointments);
    expect(result.total_children).toBe(2);
    expect(result.immunisation_up_to_date).toBe(1);
    expect(result.camhs_active).toBe(1);
    expect(result.dental_up_to_date).toBe(1);
    expect(result.optician_up_to_date).toBe(1);
    // c2 has no dentist or optician at all so both show as overdue
    expect(result.overdue_appointments.filter((o) => o.child_id === "c2")).toHaveLength(2);
  });

  it("computes dna_rate correctly", () => {
    const profiles = [makeProfile()];
    const appointments = [
      makeAppointment({ outcome: "attended" }),
      makeAppointment({ id: "a2", outcome: "dna" }),
      makeAppointment({ id: "a3", outcome: "attended" }),
    ];
    const result = computeHealthCompliance(profiles, appointments);
    // 1/3 = 33.3%
    expect(result.dna_rate).toBe(33.3);
  });
});

// ── computeWellbeingTrend ────────────────────────────────────────────────

describe("computeWellbeingTrend", () => {
  it("returns defaults for empty data", () => {
    const result = computeWellbeingTrend([]);
    expect(result.latest_wellbeing).toBe(0);
    expect(result.trend).toBe("stable");
    expect(result.sdq_band).toBeNull();
    expect(result.avg_sleep).toBe(0);
    expect(result.avg_appetite).toBe(0);
    expect(result.assessment_count).toBe(0);
  });

  it("returns stable for a single assessment", () => {
    const result = computeWellbeingTrend([makeAssessment({ overall_wellbeing: 5 })]);
    expect(result.latest_wellbeing).toBe(5);
    expect(result.trend).toBe("stable");
    expect(result.assessment_count).toBe(1);
  });

  it("detects improving trend", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_wellbeing: 3, assessment_date: "2026-01-01" }),
      makeAssessment({ id: "a2", overall_wellbeing: 4, assessment_date: "2026-02-01" }),
      makeAssessment({ id: "a3", overall_wellbeing: 7, assessment_date: "2026-03-01" }),
      makeAssessment({ id: "a4", overall_wellbeing: 8, assessment_date: "2026-04-01" }),
    ];
    const result = computeWellbeingTrend(assessments);
    expect(result.trend).toBe("improving");
    expect(result.latest_wellbeing).toBe(8);
  });

  it("detects declining trend", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_wellbeing: 8, assessment_date: "2026-01-01" }),
      makeAssessment({ id: "a2", overall_wellbeing: 7, assessment_date: "2026-02-01" }),
      makeAssessment({ id: "a3", overall_wellbeing: 3, assessment_date: "2026-03-01" }),
      makeAssessment({ id: "a4", overall_wellbeing: 2, assessment_date: "2026-04-01" }),
    ];
    const result = computeWellbeingTrend(assessments);
    expect(result.trend).toBe("declining");
  });

  it("returns SDQ band from latest assessment with sdq_scores", () => {
    const assessments = [
      makeAssessment({
        id: "a1",
        assessment_date: "2026-03-01",
        sdq_scores: {
          emotional_symptoms: 8,
          conduct_problems: 7,
          hyperactivity: 9,
          peer_problems: 6,
          prosocial: 2,
          total_difficulties: 30,
        },
      }),
    ];
    const result = computeWellbeingTrend(assessments);
    expect(result.sdq_band).toBe("abnormal");
  });
});

// ── computeChildHealthSummary ────────────────────────────────────────────

describe("computeChildHealthSummary", () => {
  it("returns correct summary with populated data", () => {
    const profile = makeProfile({
      child_id: "c1",
      immunisation_status: "partially_complete",
      camhs_status: "referred",
      allergies: ["nuts", "dairy"],
      health_conditions: ["asthma"],
      next_health_assessment: null,
    });

    const appointments = [
      makeAppointment({ appointment_type: "gp", outcome: "attended", appointment_date: "2026-05-10" }),
      makeAppointment({ id: "a2", appointment_type: "dentist", outcome: "attended", appointment_date: "2026-05-05" }),
      makeAppointment({ id: "a3", appointment_type: "gp", outcome: "dna", appointment_date: "2026-05-15" }),
    ];

    const assessments = [
      makeAssessment({ overall_wellbeing: 6, assessment_date: "2026-04-01" }),
      makeAssessment({ id: "a2", overall_wellbeing: 8, assessment_date: "2026-05-01" }),
    ];

    const result = computeChildHealthSummary(profile, appointments, assessments);
    expect(result.child_id).toBe("c1");
    expect(result.immunisation_status).toBe("partially_complete");
    expect(result.allergy_count).toBe(2);
    expect(result.condition_count).toBe(1);
    expect(result.camhs_status).toBe("referred");
    expect(result.last_gp_visit).toBe("2026-05-10");
    expect(result.last_dentist_visit).toBe("2026-05-05");
    expect(result.dna_count).toBe(1);
    expect(result.latest_wellbeing_score).toBe(8);
    expect(result.health_flags).toContain("immunisation_incomplete");
    expect(result.health_flags).toContain("camhs_referred");
    expect(result.health_flags).toContain("health_assessment_overdue");
  });

  it("returns empty flags for a fully compliant child", () => {
    const profile = makeProfile({
      immunisation_status: "up_to_date",
      camhs_status: "none",
      next_health_assessment: "2027-01-01",
    });

    // Recent dentist visit within 26 weeks
    const appointments = [
      makeAppointment({ appointment_type: "dentist", outcome: "attended", appointment_date: "2026-05-01" }),
    ];

    const result = computeChildHealthSummary(profile, appointments, []);
    // Only dental_overdue should NOT be present since dentist is recent
    expect(result.health_flags).not.toContain("immunisation_incomplete");
    expect(result.health_flags).not.toContain("camhs_referred");
    expect(result.health_flags).not.toContain("health_assessment_overdue");
    expect(result.health_flags).not.toContain("dental_overdue");
  });
});
