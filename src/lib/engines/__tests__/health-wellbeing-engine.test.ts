// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH & WELLBEING ENGINE TESTS
// Comprehensive unit + integration tests for Health & Wellbeing Intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHealthWellbeing,
  daysBetween,
  isOverdue,
  average,
  computeWellbeingTrend,
  classifySdqBand,
  computeDnaRate,
  type HealthWellbeingInput,
  type ChildInput,
  type AppointmentInput,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type OpticiansRecordInput,
  type ImmunisationRecordInput,
  type CamhsReferralInput,
  type MoodEntryInput,
} from "../health-wellbeing-engine";

// ── Factories ──────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    id: "child_1",
    name: "Alex",
    date_of_birth: "2010-06-15",
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<AppointmentInput> = {}): AppointmentInput {
  return {
    id: "appt_1",
    child_id: "child_1",
    date: "2025-03-01",
    type: "gp",
    status: "attended",
    ...overrides,
  };
}

function makeHealthAssessment(overrides: Partial<HealthAssessmentInput> = {}): HealthAssessmentInput {
  return {
    id: "ha_1",
    child_id: "child_1",
    type: "rha",
    status: "completed",
    date: "2025-01-15",
    next_due: "2026-01-15",
    sdq_total: null,
    sdq_band: null,
    ...overrides,
  };
}

function makeDentalRecord(overrides: Partial<DentalRecordInput> = {}): DentalRecordInput {
  return {
    id: "dr_1",
    child_id: "child_1",
    last_check_up_date: "2025-01-10",
    next_check_up_due: "2025-07-10",
    registration_status: "registered",
    ...overrides,
  };
}

function makeOpticiansRecord(overrides: Partial<OpticiansRecordInput> = {}): OpticiansRecordInput {
  return {
    id: "or_1",
    child_id: "child_1",
    last_exam_date: "2025-02-01",
    next_exam_due: "2026-02-01",
    ...overrides,
  };
}

function makeImmunisationRecord(overrides: Partial<ImmunisationRecordInput> = {}): ImmunisationRecordInput {
  return {
    id: "ir_1",
    child_id: "child_1",
    missed_count: 0,
    caught_up_count: 0,
    upcoming_due_count: 0,
    gp_reviewed_schedule: true,
    ...overrides,
  };
}

function makeCamhsReferral(overrides: Partial<CamhsReferralInput> = {}): CamhsReferralInput {
  return {
    id: "cr_1",
    child_id: "child_1",
    referral_date: "2024-10-01",
    referral_status: "active_engagement",
    urgency: "routine",
    sessions_held: 8,
    sessions_scheduled: 12,
    engagement_level: "strong",
    waiting_time_weeks: 0,
    ...overrides,
  };
}

function makeMoodEntry(overrides: Partial<MoodEntryInput> = {}): MoodEntryInput {
  return {
    child_id: "child_1",
    date: "2025-03-14",
    mood_score: 7,
    ...overrides,
  };
}

function makeInput(overrides: Partial<HealthWellbeingInput> = {}): HealthWellbeingInput {
  return {
    children: [],
    appointments: [],
    healthAssessments: [],
    dentalRecords: [],
    opticiansRecords: [],
    immunisationRecords: [],
    camhsReferrals: [],
    moodEntries: [],
    today: TODAY,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT TESTS — HELPERS
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Helper Functions", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2025-03-15", "2025-03-15")).toBe(0);
    });

    it("returns positive for later date", () => {
      expect(daysBetween("2025-03-01", "2025-03-15")).toBe(14);
    });

    it("returns negative for earlier date", () => {
      expect(daysBetween("2025-03-15", "2025-03-01")).toBe(-14);
    });
  });

  describe("isOverdue", () => {
    it("returns true when due date is before today", () => {
      expect(isOverdue("2025-03-10", "2025-03-15")).toBe(true);
    });

    it("returns false when due date is after today", () => {
      expect(isOverdue("2025-03-20", "2025-03-15")).toBe(false);
    });

    it("returns false when due date equals today", () => {
      expect(isOverdue("2025-03-15", "2025-03-15")).toBe(false);
    });
  });

  describe("average", () => {
    it("returns 0 for empty array", () => {
      expect(average([])).toBe(0);
    });

    it("computes correct average", () => {
      expect(average([6, 7, 8])).toBe(7);
    });

    it("rounds to one decimal place", () => {
      expect(average([7, 8])).toBe(7.5);
    });

    it("handles single value", () => {
      expect(average([5])).toBe(5);
    });
  });

  describe("computeWellbeingTrend", () => {
    it("returns improving for increase >= 0.5", () => {
      expect(computeWellbeingTrend(7.5, 6.5)).toBe("improving");
    });

    it("returns declining for decrease >= 0.5", () => {
      expect(computeWellbeingTrend(5.5, 6.5)).toBe("declining");
    });

    it("returns stable for small changes", () => {
      expect(computeWellbeingTrend(7.0, 6.8)).toBe("stable");
    });

    it("returns stable when both are 0", () => {
      expect(computeWellbeingTrend(0, 0)).toBe("stable");
    });

    it("returns stable when no baseline (previous = 0)", () => {
      expect(computeWellbeingTrend(7, 0)).toBe("stable");
    });
  });

  describe("classifySdqBand", () => {
    it("returns normal for score <= 14", () => {
      expect(classifySdqBand(10)).toBe("normal");
      expect(classifySdqBand(14)).toBe("normal");
    });

    it("returns borderline for 15-16", () => {
      expect(classifySdqBand(15)).toBe("borderline");
      expect(classifySdqBand(16)).toBe("borderline");
    });

    it("returns abnormal for 17+", () => {
      expect(classifySdqBand(17)).toBe("abnormal");
      expect(classifySdqBand(25)).toBe("abnormal");
    });
  });

  describe("computeDnaRate", () => {
    it("returns 0 when no appointments", () => {
      expect(computeDnaRate(0, 0)).toBe(0);
    });

    it("returns 0 when all attended", () => {
      expect(computeDnaRate(10, 0)).toBe(0);
    });

    it("returns 100 when all missed", () => {
      expect(computeDnaRate(0, 5)).toBe(100);
    });

    it("computes correct percentage", () => {
      expect(computeDnaRate(8, 2)).toBe(20);
    });

    it("rounds to one decimal place", () => {
      expect(computeDnaRate(7, 3)).toBe(30);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Empty Input", () => {
  it("returns safe defaults for empty input", () => {
    const result = computeHealthWellbeing(makeInput());

    expect(result.compliance.total_children).toBe(0);
    expect(result.compliance.overall_compliance_rate).toBe(100);
    expect(result.appointments.total_appointments_90d).toBe(0);
    expect(result.appointments.dna_rate).toBe(0);
    expect(result.wellbeing_trends).toHaveLength(0);
    expect(result.child_profiles).toHaveLength(0);
    expect(result.camhs.active_referrals).toBe(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Compliance", () => {
  it("calculates full compliance when all records are current", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [makeHealthAssessment()],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    expect(result.compliance.immunisation_up_to_date).toBe(1);
    expect(result.compliance.dental_up_to_date).toBe(1);
    expect(result.compliance.optician_up_to_date).toBe(1);
    expect(result.compliance.health_assessment_current).toBe(1);
    expect(result.compliance.overall_compliance_rate).toBe(100);
  });

  it("detects overdue dental appointment", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      dentalRecords: [makeDentalRecord({ next_check_up_due: "2025-02-01" })], // past
      healthAssessments: [makeHealthAssessment()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    expect(result.compliance.dental_up_to_date).toBe(0);
    expect(result.compliance.overall_compliance_rate).toBe(75);
  });

  it("detects overdue optician appointment", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      opticiansRecords: [makeOpticiansRecord({ next_exam_due: "2025-01-01" })],
      healthAssessments: [makeHealthAssessment()],
      dentalRecords: [makeDentalRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    expect(result.compliance.optician_up_to_date).toBe(0);
  });

  it("detects missed immunisations", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      immunisationRecords: [makeImmunisationRecord({ missed_count: 2, caught_up_count: 0 })],
      healthAssessments: [makeHealthAssessment()],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
    }));

    expect(result.compliance.immunisation_up_to_date).toBe(0);
  });

  it("considers caught-up immunisations as compliant", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      immunisationRecords: [makeImmunisationRecord({ missed_count: 2, caught_up_count: 2 })],
      healthAssessments: [makeHealthAssessment()],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
    }));

    expect(result.compliance.immunisation_up_to_date).toBe(1);
  });

  it("marks overdue health assessment as non-current", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [makeHealthAssessment({ next_due: "2025-01-01" })],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    expect(result.compliance.health_assessment_current).toBe(0);
  });

  it("marks non-completed health assessment as non-current", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [makeHealthAssessment({ status: "scheduled" })],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    expect(result.compliance.health_assessment_current).toBe(0);
  });

  it("handles multiple children with mixed compliance", () => {
    const children = [
      makeChild({ id: "c1", name: "Child A" }),
      makeChild({ id: "c2", name: "Child B" }),
    ];
    const result = computeHealthWellbeing(makeInput({
      children,
      healthAssessments: [
        makeHealthAssessment({ child_id: "c1" }),
        makeHealthAssessment({ child_id: "c2", status: "overdue", next_due: "2025-01-01" }),
      ],
      dentalRecords: [
        makeDentalRecord({ child_id: "c1" }),
        // c2 missing dental
      ],
      opticiansRecords: [
        makeOpticiansRecord({ child_id: "c1" }),
        makeOpticiansRecord({ child_id: "c2" }),
      ],
      immunisationRecords: [
        makeImmunisationRecord({ child_id: "c1" }),
        makeImmunisationRecord({ child_id: "c2" }),
      ],
    }));

    expect(result.compliance.total_children).toBe(2);
    expect(result.compliance.dental_up_to_date).toBe(1);
    expect(result.compliance.health_assessment_current).toBe(1);
    // 1+1+2+2 = 6 of 8 checks pass
    expect(result.compliance.overall_compliance_rate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — APPOINTMENTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Appointments", () => {
  it("counts appointments by status within 90 days", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-02-15" }),
        makeAppointment({ id: "a3", status: "missed", date: "2025-03-01" }),
        makeAppointment({ id: "a4", status: "cancelled", date: "2025-01-20" }),
        makeAppointment({ id: "a5", status: "scheduled", date: "2025-03-18" }), // upcoming
      ],
    }));

    expect(result.appointments.total_appointments_90d).toBe(4); // excludes future scheduled
    expect(result.appointments.attended).toBe(2);
    expect(result.appointments.missed).toBe(1);
    expect(result.appointments.cancelled).toBe(1);
    expect(result.appointments.upcoming_7d).toBe(1);
  });

  it("calculates correct DNA rate", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-02-10" }),
        makeAppointment({ id: "a3", status: "attended", date: "2025-02-20" }),
        makeAppointment({ id: "a4", status: "missed", date: "2025-03-01" }),
      ],
    }));

    // 1 missed / (3 attended + 1 missed) = 25%
    expect(result.appointments.dna_rate).toBe(25);
  });

  it("excludes appointments older than 90 days", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2024-11-01" }), // > 90 days
        makeAppointment({ id: "a2", status: "attended", date: "2025-02-01" }),
      ],
    }));

    expect(result.appointments.total_appointments_90d).toBe(1);
    expect(result.appointments.attended).toBe(1);
  });

  it("returns zero DNA rate when all attended", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-03-01" }),
      ],
    }));

    expect(result.appointments.dna_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — WELLBEING TRENDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Wellbeing Trends", () => {
  it("detects improving wellbeing trend", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      // Previous period (8-14 days ago)
      makeMoodEntry({ date: "2025-03-05", mood_score: 5 }),
      makeMoodEntry({ date: "2025-03-06", mood_score: 5 }),
      makeMoodEntry({ date: "2025-03-07", mood_score: 5 }),
      // Current period (last 7 days)
      makeMoodEntry({ date: "2025-03-12", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-13", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 7 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    expect(result.wellbeing_trends).toHaveLength(1);
    expect(result.wellbeing_trends[0].trend).toBe("improving");
    expect(result.wellbeing_trends[0].current_avg).toBeGreaterThan(result.wellbeing_trends[0].previous_avg);
  });

  it("detects declining wellbeing trend", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      // Previous period (8-14 days ago)
      makeMoodEntry({ date: "2025-03-04", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-05", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-06", mood_score: 7 }),
      // Current period (last 7 days)
      makeMoodEntry({ date: "2025-03-12", mood_score: 4 }),
      makeMoodEntry({ date: "2025-03-13", mood_score: 5 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 4 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    expect(result.wellbeing_trends).toHaveLength(1);
    expect(result.wellbeing_trends[0].trend).toBe("declining");
  });

  it("detects stable wellbeing trend", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      makeMoodEntry({ date: "2025-03-04", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-05", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-12", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 7 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    expect(result.wellbeing_trends).toHaveLength(1);
    expect(result.wellbeing_trends[0].trend).toBe("stable");
  });

  it("reports latest score correctly", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      makeMoodEntry({ date: "2025-03-10", mood_score: 5 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-12", mood_score: 6 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    expect(result.wellbeing_trends[0].latest_score).toBe(8);
  });

  it("only includes children with mood data in last 30 days", () => {
    const children = [
      makeChild({ id: "c1", name: "With Data" }),
      makeChild({ id: "c2", name: "Without Data" }),
    ];
    const result = computeHealthWellbeing(makeInput({
      children,
      moodEntries: [makeMoodEntry({ child_id: "c1", date: "2025-03-14" })],
    }));

    expect(result.wellbeing_trends).toHaveLength(1);
    expect(result.wellbeing_trends[0].child_name).toBe("With Data");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — CHILD HEALTH PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Child Profiles", () => {
  it("builds complete profile for a fully-compliant child", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [
        makeHealthAssessment(),
        makeHealthAssessment({ id: "ha_sdq", type: "sdq", sdq_total: 12, sdq_band: "normal" }),
      ],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
      camhsReferrals: [makeCamhsReferral()],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-03-01" }),
      ],
      moodEntries: [
        makeMoodEntry({ date: "2025-03-14", mood_score: 8 }),
      ],
    }));

    const profile = result.child_profiles[0];
    expect(profile.child_name).toBe("Alex");
    expect(profile.dental_up_to_date).toBe(true);
    expect(profile.optician_up_to_date).toBe(true);
    expect(profile.immunisation_up_to_date).toBe(true);
    expect(profile.health_assessment_current).toBe(true);
    expect(profile.sdq_band).toBe("normal");
    expect(profile.sdq_total).toBe(12);
    expect(profile.camhs_status).toBe("active_engagement");
    expect(profile.camhs_engagement).toBe("strong");
    expect(profile.appointments_attended_90d).toBe(2);
    expect(profile.appointments_missed_90d).toBe(0);
  });

  it("reports unknown wellbeing trend when no mood data", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
    }));

    expect(result.child_profiles[0].wellbeing_score).toBeNull();
    expect(result.child_profiles[0].wellbeing_trend).toBe("unknown");
  });

  it("reports null CAMHS when no referral exists", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
    }));

    expect(result.child_profiles[0].camhs_status).toBeNull();
    expect(result.child_profiles[0].camhs_engagement).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — CAMHS SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — CAMHS", () => {
  it("counts active referrals", () => {
    const children = [
      makeChild({ id: "c1" }),
      makeChild({ id: "c2" }),
    ];
    const result = computeHealthWellbeing(makeInput({
      children,
      camhsReferrals: [
        makeCamhsReferral({ child_id: "c1", referral_status: "active_engagement" }),
        makeCamhsReferral({ id: "cr_2", child_id: "c2", referral_status: "on_waiting_list", waiting_time_weeks: 16 }),
      ],
    }));

    expect(result.camhs.active_referrals).toBe(1);
    expect(result.camhs.waiting_list).toBe(1);
  });

  it("computes average waiting weeks", () => {
    const children = [
      makeChild({ id: "c1" }),
      makeChild({ id: "c2" }),
    ];
    const result = computeHealthWellbeing(makeInput({
      children,
      camhsReferrals: [
        makeCamhsReferral({ id: "cr_1", child_id: "c1", referral_status: "on_waiting_list", waiting_time_weeks: 10 }),
        makeCamhsReferral({ id: "cr_2", child_id: "c2", referral_status: "on_waiting_list", waiting_time_weeks: 20 }),
      ],
    }));

    expect(result.camhs.avg_waiting_weeks).toBe(15);
  });

  it("counts disengaged children", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "active_engagement", engagement_level: "disengaged" }),
      ],
    }));

    expect(result.camhs.disengaged_count).toBe(1);
  });

  it("totals sessions held across all referrals", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeHealthWellbeing(makeInput({
      children,
      camhsReferrals: [
        makeCamhsReferral({ id: "cr_1", child_id: "c1", sessions_held: 5 }),
        makeCamhsReferral({ id: "cr_2", child_id: "c2", sessions_held: 8 }),
      ],
    }));

    expect(result.camhs.total_sessions_held).toBe(13);
  });

  it("includes triaged referrals in waiting list count", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "triaged", waiting_time_weeks: 4 }),
      ],
    }));

    expect(result.camhs.waiting_list).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — HEALTH ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Health Alerts", () => {
  it("generates SDQ abnormal alert", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [
        makeHealthAssessment({ type: "sdq", sdq_total: 22, sdq_band: "abnormal" }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "sdq_abnormal");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.child_name).toBe("Alex");
  });

  it("generates declining wellbeing alert for low score", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      makeMoodEntry({ date: "2025-03-04", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-05", mood_score: 7 }),
      makeMoodEntry({ date: "2025-03-12", mood_score: 3 }),
      makeMoodEntry({ date: "2025-03-13", mood_score: 4 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 4 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    const alert = result.alerts.find((a) => a.type === "wellbeing_declining" && a.severity === "high");
    expect(alert).toBeDefined();
  });

  it("generates medium severity declining wellbeing alert", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      makeMoodEntry({ date: "2025-03-04", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-05", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-12", mood_score: 6 }),
      makeMoodEntry({ date: "2025-03-13", mood_score: 6 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 6 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      moodEntries,
    }));

    const alert = result.alerts.find((a) => a.type === "wellbeing_declining" && a.severity === "medium");
    expect(alert).toBeDefined();
  });

  it("generates overdue health assessment alert", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [makeHealthAssessment({ status: "overdue", next_due: "2025-01-01" })],
    }));

    const alert = result.alerts.find((a) => a.type === "health_assessment_overdue");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("generates CAMHS disengagement alert", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "active_engagement", engagement_level: "disengaged" }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "camhs_disengaged");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("generates high DNA rate alert", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "missed", date: "2025-02-10" }),
        makeAppointment({ id: "a3", status: "missed", date: "2025-02-20" }),
        makeAppointment({ id: "a4", status: "missed", date: "2025-03-01" }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "high_dna_rate");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("75%");
  });

  it("sorts alerts by severity (high before medium)", () => {
    const child = makeChild();
    const moodEntries: MoodEntryInput[] = [
      makeMoodEntry({ date: "2025-03-04", mood_score: 8 }),
      makeMoodEntry({ date: "2025-03-12", mood_score: 6 }),
      makeMoodEntry({ date: "2025-03-14", mood_score: 6 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [
        makeHealthAssessment({ type: "sdq", sdq_total: 20, sdq_band: "abnormal" }),
      ],
      moodEntries,
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "active_engagement", engagement_level: "disengaged" }),
      ],
    }));

    // High-severity SDQ alert should come before medium-severity declining
    const highIdx = result.alerts.findIndex((a) => a.severity === "high");
    const medIdx = result.alerts.findIndex((a) => a.severity === "medium");
    if (highIdx !== -1 && medIdx !== -1) {
      expect(highIdx).toBeLessThan(medIdx);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — ARIA INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — ARIA Insights", () => {
  it("generates warning for missing health assessment", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      // No health assessments
    }));

    const insight = result.insights.find((i) => i.text.includes("health assessment"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates warning for high DNA rate", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-02-10" }),
        makeAppointment({ id: "a3", status: "missed", date: "2025-02-20" }),
        makeAppointment({ id: "a4", status: "missed", date: "2025-03-01" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("DNA rate"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates warning for SDQ abnormal", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [
        makeHealthAssessment({ type: "sdq", sdq_total: 20, sdq_band: "abnormal" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("SDQ total in abnormal"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates warning for long CAMHS waiting time", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "on_waiting_list", waiting_time_weeks: 20 }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("waiting list"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates positive insight for full compliance", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      healthAssessments: [makeHealthAssessment()],
      dentalRecords: [makeDentalRecord()],
      opticiansRecords: [makeOpticiansRecord()],
      immunisationRecords: [makeImmunisationRecord()],
    }));

    const insight = result.insights.find((i) => i.text.includes("Excellent Reg 23"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for improving wellbeing", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const moodEntries: MoodEntryInput[] = [
      // c1 improving
      makeMoodEntry({ child_id: "c1", date: "2025-03-04", mood_score: 5 }),
      makeMoodEntry({ child_id: "c1", date: "2025-03-14", mood_score: 8 }),
      // c2 improving
      makeMoodEntry({ child_id: "c2", date: "2025-03-04", mood_score: 4 }),
      makeMoodEntry({ child_id: "c2", date: "2025-03-14", mood_score: 7 }),
    ];

    const result = computeHealthWellbeing(makeInput({
      children,
      moodEntries,
    }));

    const insight = result.insights.find((i) => i.text.includes("improving wellbeing"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for low DNA rate", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      appointments: [
        makeAppointment({ id: "a1", status: "attended", date: "2025-02-01" }),
        makeAppointment({ id: "a2", status: "attended", date: "2025-02-15" }),
        makeAppointment({ id: "a3", status: "attended", date: "2025-03-01" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("well-supported to attend"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for CAMHS engagement", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      camhsReferrals: [
        makeCamhsReferral({ referral_status: "active_engagement", engagement_level: "strong" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("engagement"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates immunisation gap warning", () => {
    const child = makeChild();
    const result = computeHealthWellbeing(makeInput({
      children: [child],
      immunisationRecords: [makeImmunisationRecord({ missed_count: 3, caught_up_count: 0 })],
    }));

    const insight = result.insights.find((i) => i.text.includes("immunisations"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("always generates at least one insight", () => {
    const result = computeHealthWellbeing(makeInput());
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL INTEGRATION TEST — OAK HOUSE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Health & Wellbeing Engine — Oak House Integration", () => {
  it("produces comprehensive analysis for multi-child home", () => {
    const children: ChildInput[] = [
      { id: "yp_alex", name: "Alex", date_of_birth: "2010-06-15" },
      { id: "yp_jordan", name: "Jordan", date_of_birth: "2009-09-20" },
      { id: "yp_casey", name: "Casey", date_of_birth: "2011-03-10" },
      { id: "yp_sam", name: "Sam", date_of_birth: "2008-12-01" },
    ];

    const appointments: AppointmentInput[] = [
      { id: "a1", child_id: "yp_alex", date: "2025-02-05", type: "camhs", status: "attended" },
      { id: "a2", child_id: "yp_alex", date: "2025-03-05", type: "camhs", status: "attended" },
      { id: "a3", child_id: "yp_jordan", date: "2025-02-10", type: "gp", status: "attended" },
      { id: "a4", child_id: "yp_jordan", date: "2025-02-20", type: "dental", status: "missed" },
      { id: "a5", child_id: "yp_casey", date: "2025-01-15", type: "optician", status: "attended" },
      { id: "a6", child_id: "yp_casey", date: "2025-03-10", type: "dental", status: "attended" },
      { id: "a7", child_id: "yp_sam", date: "2025-02-01", type: "gp", status: "missed" },
      { id: "a8", child_id: "yp_sam", date: "2025-02-15", type: "camhs", status: "missed" },
      { id: "a9", child_id: "yp_sam", date: "2025-03-01", type: "camhs", status: "missed" },
      { id: "a10", child_id: "yp_sam", date: "2025-03-18", type: "gp", status: "scheduled" },
    ];

    const healthAssessments: HealthAssessmentInput[] = [
      { id: "ha1", child_id: "yp_alex", type: "rha", status: "completed", date: "2024-12-01", next_due: "2025-12-01", sdq_total: null, sdq_band: null },
      { id: "ha2", child_id: "yp_alex", type: "sdq", status: "completed", date: "2025-01-15", next_due: "2025-07-15", sdq_total: 15, sdq_band: "borderline" },
      { id: "ha3", child_id: "yp_jordan", type: "rha", status: "completed", date: "2024-11-01", next_due: "2025-11-01", sdq_total: null, sdq_band: null },
      { id: "ha4", child_id: "yp_jordan", type: "sdq", status: "completed", date: "2025-02-01", next_due: "2025-08-01", sdq_total: 10, sdq_band: "normal" },
      { id: "ha5", child_id: "yp_casey", type: "iha", status: "completed", date: "2025-01-05", next_due: "2026-01-05", sdq_total: null, sdq_band: null },
      { id: "ha6", child_id: "yp_sam", type: "rha", status: "overdue", date: "2024-03-01", next_due: "2025-03-01", sdq_total: null, sdq_band: null },
      { id: "ha7", child_id: "yp_sam", type: "sdq", status: "completed", date: "2024-12-01", next_due: "2025-06-01", sdq_total: 22, sdq_band: "abnormal" },
    ];

    const dentalRecords: DentalRecordInput[] = [
      { id: "d1", child_id: "yp_alex", last_check_up_date: "2025-01-10", next_check_up_due: "2025-07-10", registration_status: "registered" },
      { id: "d2", child_id: "yp_jordan", last_check_up_date: "2024-06-01", next_check_up_due: "2024-12-01", registration_status: "registered" }, // overdue
      { id: "d3", child_id: "yp_casey", last_check_up_date: "2025-03-10", next_check_up_due: "2025-09-10", registration_status: "registered" },
      { id: "d4", child_id: "yp_sam", last_check_up_date: "2025-02-01", next_check_up_due: "2025-08-01", registration_status: "registered" },
    ];

    const opticiansRecords: OpticiansRecordInput[] = [
      { id: "o1", child_id: "yp_alex", last_exam_date: "2025-02-01", next_exam_due: "2026-02-01" },
      { id: "o2", child_id: "yp_jordan", last_exam_date: "2024-09-01", next_exam_due: "2025-09-01" },
      { id: "o3", child_id: "yp_casey", last_exam_date: "2024-06-01", next_exam_due: "2025-06-01" },
      // Sam has no optician record
    ];

    const immunisationRecords: ImmunisationRecordInput[] = [
      { id: "i1", child_id: "yp_alex", missed_count: 0, caught_up_count: 0, upcoming_due_count: 0, gp_reviewed_schedule: true },
      { id: "i2", child_id: "yp_jordan", missed_count: 0, caught_up_count: 0, upcoming_due_count: 1, gp_reviewed_schedule: true },
      { id: "i3", child_id: "yp_casey", missed_count: 0, caught_up_count: 0, upcoming_due_count: 0, gp_reviewed_schedule: true },
      { id: "i4", child_id: "yp_sam", missed_count: 2, caught_up_count: 0, upcoming_due_count: 0, gp_reviewed_schedule: false },
    ];

    const camhsReferrals: CamhsReferralInput[] = [
      { id: "cr1", child_id: "yp_alex", referral_date: "2024-08-01", referral_status: "active_engagement", urgency: "routine", sessions_held: 12, sessions_scheduled: 24, engagement_level: "strong", waiting_time_weeks: 0 },
      { id: "cr2", child_id: "yp_sam", referral_date: "2024-11-01", referral_status: "active_engagement", urgency: "soon", sessions_held: 3, sessions_scheduled: 12, engagement_level: "disengaged", waiting_time_weeks: 0 },
    ];

    const moodEntries: MoodEntryInput[] = [
      // Alex — improving
      { child_id: "yp_alex", date: "2025-03-02", mood_score: 6 },
      { child_id: "yp_alex", date: "2025-03-04", mood_score: 6 },
      { child_id: "yp_alex", date: "2025-03-09", mood_score: 7 },
      { child_id: "yp_alex", date: "2025-03-12", mood_score: 8 },
      { child_id: "yp_alex", date: "2025-03-14", mood_score: 8 },
      // Jordan — stable
      { child_id: "yp_jordan", date: "2025-03-03", mood_score: 7 },
      { child_id: "yp_jordan", date: "2025-03-05", mood_score: 7 },
      { child_id: "yp_jordan", date: "2025-03-10", mood_score: 7 },
      { child_id: "yp_jordan", date: "2025-03-13", mood_score: 8 },
      // Casey — stable/improving
      { child_id: "yp_casey", date: "2025-03-04", mood_score: 8 },
      { child_id: "yp_casey", date: "2025-03-11", mood_score: 9 },
      { child_id: "yp_casey", date: "2025-03-14", mood_score: 9 },
      // Sam — declining
      { child_id: "yp_sam", date: "2025-03-02", mood_score: 6 },
      { child_id: "yp_sam", date: "2025-03-05", mood_score: 5 },
      { child_id: "yp_sam", date: "2025-03-10", mood_score: 4 },
      { child_id: "yp_sam", date: "2025-03-13", mood_score: 3 },
      { child_id: "yp_sam", date: "2025-03-14", mood_score: 3 },
    ];

    const result = computeHealthWellbeing({
      children,
      appointments,
      healthAssessments,
      dentalRecords,
      opticiansRecords,
      immunisationRecords,
      camhsReferrals,
      moodEntries,
      today: TODAY,
    });

    // ── Compliance checks ──────────────────────────────────────────────────
    expect(result.compliance.total_children).toBe(4);
    expect(result.compliance.immunisation_up_to_date).toBe(3); // Sam has missed
    expect(result.compliance.dental_up_to_date).toBe(3); // Jordan overdue
    expect(result.compliance.optician_up_to_date).toBe(3); // Sam no record
    expect(result.compliance.health_assessment_current).toBe(3); // Sam overdue

    // ── Appointments ───────────────────────────────────────────────────────
    expect(result.appointments.total_appointments_90d).toBe(9);
    expect(result.appointments.attended).toBe(5);
    expect(result.appointments.missed).toBe(4);
    expect(result.appointments.upcoming_7d).toBe(1); // Sam's GP on 18th
    // DNA rate: 4/(5+4) ≈ 44.4%
    expect(result.appointments.dna_rate).toBeGreaterThan(40);

    // ── Wellbeing trends ───────────────────────────────────────────────────
    expect(result.wellbeing_trends).toHaveLength(4);
    const alexTrend = result.wellbeing_trends.find((w) => w.child_id === "yp_alex");
    expect(alexTrend?.trend).toBe("improving");
    const samTrend = result.wellbeing_trends.find((w) => w.child_id === "yp_sam");
    expect(samTrend?.trend).toBe("declining");

    // ── Child profiles ─────────────────────────────────────────────────────
    expect(result.child_profiles).toHaveLength(4);
    const samProfile = result.child_profiles.find((p) => p.child_id === "yp_sam");
    expect(samProfile?.sdq_band).toBe("abnormal");
    expect(samProfile?.immunisation_up_to_date).toBe(false);
    expect(samProfile?.dental_up_to_date).toBe(true);
    expect(samProfile?.optician_up_to_date).toBe(false);
    expect(samProfile?.camhs_status).toBe("active_engagement");
    expect(samProfile?.camhs_engagement).toBe("disengaged");
    expect(samProfile?.appointments_missed_90d).toBe(3);

    const alexProfile = result.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alexProfile?.sdq_band).toBe("borderline");
    expect(alexProfile?.camhs_status).toBe("active_engagement");
    expect(alexProfile?.camhs_engagement).toBe("strong");

    // ── CAMHS ──────────────────────────────────────────────────────────────
    expect(result.camhs.active_referrals).toBe(2);
    expect(result.camhs.disengaged_count).toBe(1);
    expect(result.camhs.total_sessions_held).toBe(15);

    // ── Alerts ─────────────────────────────────────────────────────────────
    expect(result.alerts.length).toBeGreaterThan(0);
    // Sam should have SDQ abnormal alert
    expect(result.alerts.some((a) => a.type === "sdq_abnormal" && a.child_name === "Sam")).toBe(true);
    // Sam should have declining wellbeing alert
    expect(result.alerts.some((a) => a.type === "wellbeing_declining" && a.child_name === "Sam")).toBe(true);
    // Sam should have overdue health assessment alert
    expect(result.alerts.some((a) => a.type === "health_assessment_overdue" && a.child_name === "Sam")).toBe(true);
    // Sam should have CAMHS disengagement alert
    expect(result.alerts.some((a) => a.type === "camhs_disengaged" && a.child_name === "Sam")).toBe(true);
    // Sam should have high DNA rate alert
    expect(result.alerts.some((a) => a.type === "high_dna_rate" && a.child_name === "Sam")).toBe(true);

    // ── Insights ───────────────────────────────────────────────────────────
    expect(result.insights.length).toBeGreaterThan(0);
    // Should have DNA rate warning
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("DNA rate"))).toBe(true);
    // Should have SDQ warning
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("SDQ"))).toBe(true);
    // Should have immunisation warning
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("immunisations"))).toBe(true);
    // Should have CAMHS disengagement warning
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("disengaged"))).toBe(true);
  });
});
