import { describe, it, expect } from "vitest";
import {
  computeStaffWellbeing,
  type StaffWellbeingInput,
  type StaffMemberInput,
  type ShiftInput,
  type SupervisionInput,
  type SicknessInput,
  type WellbeingCheckInput,
  type DebriefInput,
  type RecognitionInput,
  type GrievanceInput,
  type IncidentInvolvementInput,
} from "../staff-wellbeing-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffMemberInput> = {}): StaffMemberInput {
  return {
    id: "s1",
    name: "Jane Smith",
    role: "Senior Residential Care Worker",
    start_date: "2023-06-01",
    contracted_hours: 37.5,
    is_active: true,
    ...overrides,
  };
}

function makeShift(overrides: Partial<ShiftInput> = {}): ShiftInput {
  return {
    staff_id: "s1",
    date: "2026-05-20",
    shift_type: "day",
    start_time: "07:00",
    end_time: "15:00",
    overtime_minutes: 0,
    status: "completed",
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SupervisionInput> = {}): SupervisionInput {
  return {
    staff_id: "s1",
    scheduled_date: "2026-05-10",
    actual_date: "2026-05-10",
    status: "completed",
    wellbeing_score: 7,
    duration_minutes: 60,
    ...overrides,
  };
}

function makeSickness(overrides: Partial<SicknessInput> = {}): SicknessInput {
  return {
    staff_id: "s1",
    date_started: "2026-05-01",
    date_ended: "2026-05-03",
    total_days: 3,
    category: "physical",
    reason: "Back pain",
    rtw_status: "completed",
    occupational_health_referral: false,
    trigger_points: [],
    ...overrides,
  };
}

function makeWellbeingCheck(overrides: Partial<WellbeingCheckInput> = {}): WellbeingCheckInput {
  return {
    staff_id: "s1",
    date: "2026-05-15",
    overall_score: 7,
    workload_score: 6,
    support_score: 8,
    moral_score: 7,
    stressors: [],
    action_agreed: "None",
    follow_up_date: null,
    ...overrides,
  };
}

function baseInput(overrides: Partial<StaffWellbeingInput> = {}): StaffWellbeingInput {
  return {
    today: "2026-05-26",
    home_name: "Chamberlain House",
    staff: [
      makeStaff({ id: "s1", name: "Jane Smith" }),
      makeStaff({ id: "s2", name: "Tom Brown", start_date: "2024-01-15" }),
      makeStaff({ id: "s3", name: "Sara Jones", start_date: "2025-11-01" }),
    ],
    shifts: [
      ...Array.from({ length: 15 }, (_, i) => makeShift({ staff_id: "s1", date: `2026-05-${String(i + 1).padStart(2, "0")}` })),
      ...Array.from({ length: 12 }, (_, i) => makeShift({ staff_id: "s2", date: `2026-05-${String(i + 1).padStart(2, "0")}` })),
      ...Array.from({ length: 10 }, (_, i) => makeShift({ staff_id: "s3", date: `2026-05-${String(i + 1).padStart(2, "0")}` })),
    ],
    leave_requests: [],
    supervisions: [
      makeSupervision({ staff_id: "s1", actual_date: "2026-05-10" }),
      makeSupervision({ staff_id: "s2", actual_date: "2026-05-08" }),
      makeSupervision({ staff_id: "s3", actual_date: "2026-05-12" }),
    ],
    sickness_records: [],
    wellbeing_checks: [
      makeWellbeingCheck({ staff_id: "s1", overall_score: 7 }),
      makeWellbeingCheck({ staff_id: "s2", overall_score: 8 }),
    ],
    debrief_records: [],
    recognition_records: [],
    grievance_records: [],
    incidents: [],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Staff Wellbeing Intelligence Engine", () => {
  it("produces result with all required fields for healthy team", () => {
    const result = computeStaffWellbeing(baseInput());
    expect(result.generated_at).toBe("2026-05-26");
    expect(result.home_name).toBe("Chamberlain House");
    expect(result.staff_profiles).toHaveLength(3);
    expect(result.workforce_pulse.total_active_staff).toBe(3);
    expect(result.home_resilience).toBeDefined();
    expect(result.sickness_analysis).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(result.priority_actions).toBeDefined();
  });

  it("returns adequate or strong resilience for healthy team", () => {
    const result = computeStaffWellbeing(baseInput());
    expect(["strong", "adequate"]).toContain(result.home_resilience.level);
    expect(result.home_resilience.score).toBeGreaterThanOrEqual(55);
    expect(result.home_resilience.headline).toContain("Chamberlain House");
  });

  it("computes low burnout for staff with good indicators", () => {
    const result = computeStaffWellbeing(baseInput());
    const jane = result.staff_profiles.find((p) => p.staff_id === "s1");
    expect(jane).toBeDefined();
    expect(["low", "moderate"]).toContain(jane!.burnout_risk);
    expect(jane!.burnout_score).toBeLessThan(40);
  });

  it("flags critical burnout for overworked staff", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [makeStaff({ id: "s1", name: "Jane Smith" })],
      shifts: Array.from({ length: 25 }, (_, i) =>
        makeShift({
          staff_id: "s1",
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          overtime_minutes: 90,
        }),
      ),
      supervisions: [],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, date_started: "2026-04-01" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", date: "2026-05-15", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-04-15", overall_score: 5 }),
      ],
      incidents: [
        { staff_id: "s1", date: "2026-05-20", severity: "high", type: "restraint" },
        { staff_id: "s1", date: "2026-05-18", severity: "medium", type: "incident" },
        { staff_id: "s1", date: "2026-05-16", severity: "low", type: "incident" },
        { staff_id: "s1", date: "2026-05-14", severity: "high", type: "restraint" },
      ],
    }));
    const jane = result.staff_profiles[0];
    expect(jane.burnout_risk).toBe("critical");
    expect(jane.burnout_score).toBeGreaterThanOrEqual(60);
    expect(jane.risk_factors.length).toBeGreaterThan(0);
  });

  it("computes sickness analysis correctly", () => {
    const result = computeStaffWellbeing(baseInput({
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 5, category: "stress", reason: "Work-related stress", date_started: "2026-04-10" }),
        makeSickness({ staff_id: "s2", total_days: 3, category: "physical", reason: "Flu", date_started: "2026-05-01" }),
        makeSickness({ staff_id: "s1", total_days: 2, category: "mental_health", reason: "Anxiety", date_started: "2026-05-15", occupational_health_referral: true }),
      ],
    }));
    expect(result.sickness_analysis.total_days_lost_90d).toBe(10);
    expect(result.sickness_analysis.stress_related_pct).toBeGreaterThan(50);
    expect(result.sickness_analysis.occupational_health_referrals).toBe(1);
    expect(result.sickness_analysis.top_categories.length).toBeGreaterThan(0);
  });

  it("generates early warnings for high-risk patterns", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [makeStaff({ id: "s1", name: "Jane Smith" })],
      shifts: Array.from({ length: 25 }, (_, i) =>
        makeShift({
          staff_id: "s1",
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          overtime_minutes: 120,
        }),
      ),
      supervisions: [],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, date_started: "2026-04-01" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", date: "2026-05-15", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-04-15", overall_score: 5 }),
      ],
      incidents: [
        { staff_id: "s1", date: "2026-05-20", severity: "high", type: "restraint" },
        { staff_id: "s1", date: "2026-05-18", severity: "high", type: "incident" },
        { staff_id: "s1", date: "2026-05-16", severity: "medium", type: "incident" },
      ],
    }));
    expect(result.early_warnings.length).toBeGreaterThan(0);
    const burnoutWarning = result.early_warnings.find((w) => w.domain === "burnout");
    expect(burnoutWarning).toBeDefined();
    expect(burnoutWarning!.severity).toBe("critical");
  });

  it("identifies supervision overdue correctly", () => {
    const result = computeStaffWellbeing(baseInput({
      supervisions: [],
    }));
    const overdue = result.staff_profiles.filter((p) => p.supervision_overdue);
    expect(overdue).toHaveLength(3);
    expect(result.workforce_pulse.staff_with_no_supervision_60d).toBe(3);
  });

  it("generates priority actions from issues", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [makeStaff({ id: "s1", name: "Jane Smith" })],
      shifts: Array.from({ length: 25 }, (_, i) =>
        makeShift({
          staff_id: "s1",
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          overtime_minutes: 120,
        }),
      ),
      supervisions: [],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, category: "stress", reason: "Stress", date_started: "2026-04-01" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", date: "2026-05-15", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-04-15", overall_score: 5 }),
      ],
      incidents: [
        { staff_id: "s1", date: "2026-05-20", severity: "high", type: "restraint" },
        { staff_id: "s1", date: "2026-05-18", severity: "high", type: "incident" },
        { staff_id: "s1", date: "2026-05-16", severity: "medium", type: "incident" },
        { staff_id: "s1", date: "2026-05-14", severity: "low", type: "incident" },
      ],
    }));
    expect(result.priority_actions.length).toBeGreaterThan(0);
    const criticalAction = result.priority_actions.find((a) => a.severity === "critical");
    expect(criticalAction).toBeDefined();
    expect(criticalAction!.regulatory_ref).toBe("Reg 33");
  });

  it("computes workforce pulse metrics correctly", () => {
    const result = computeStaffWellbeing(baseInput({
      recognition_records: [
        { staff_id: "s1", date: "2026-05-10", type: "peer" },
        { staff_id: "s2", date: "2026-05-05", type: "manager" },
      ],
      grievance_records: [
        { staff_id: "s3", date: "2026-05-12", status: "open", category: "workload" },
      ],
    }));
    expect(result.workforce_pulse.total_active_staff).toBe(3);
    expect(result.workforce_pulse.recognition_rate_90d).toBeGreaterThan(0);
    expect(result.workforce_pulse.grievance_rate_90d).toBeGreaterThan(0);
  });

  it("detects new staff (first year) correctly", () => {
    const result = computeStaffWellbeing(baseInput());
    expect(result.workforce_pulse.staff_in_first_year).toBe(1);
    const sara = result.staff_profiles.find((p) => p.staff_id === "s3");
    expect(sara!.tenure_months).toBeLessThan(12);
  });

  it("computes wellbeing trend from check history", () => {
    const result = computeStaffWellbeing(baseInput({
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", date: "2026-05-20", overall_score: 4 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-05-10", overall_score: 5 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-04-20", overall_score: 6 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-04-10", overall_score: 7 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-03-20", overall_score: 8 }),
        makeWellbeingCheck({ staff_id: "s1", date: "2026-03-10", overall_score: 8 }),
      ],
    }));
    const jane = result.staff_profiles.find((p) => p.staff_id === "s1");
    expect(jane!.wellbeing_trend).toBe("declining");
  });

  it("returns no_data wellbeing trend when insufficient checks", () => {
    const result = computeStaffWellbeing(baseInput({
      wellbeing_checks: [],
    }));
    const s1 = result.staff_profiles.find((p) => p.staff_id === "s1");
    expect(s1!.wellbeing_trend).toBe("no_data");
    expect(s1!.latest_wellbeing_score).toBeNull();
  });

  it("sorts staff profiles by burnout score descending", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [
        makeStaff({ id: "s1", name: "Jane Smith" }),
        makeStaff({ id: "s2", name: "Tom Brown" }),
      ],
      shifts: [
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s1", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 90 })),
        ...Array.from({ length: 10 }, (_, i) => makeShift({ staff_id: "s2", date: `2026-05-${String(i + 1).padStart(2, "0")}` })),
      ],
      supervisions: [
        makeSupervision({ staff_id: "s2", actual_date: "2026-05-10" }),
      ],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, date_started: "2026-04-01" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s2", overall_score: 8 }),
      ],
    }));
    expect(result.staff_profiles[0].burnout_score).toBeGreaterThanOrEqual(result.staff_profiles[1].burnout_score);
  });

  it("detects protective factors for well-supported staff", () => {
    const result = computeStaffWellbeing(baseInput({
      recognition_records: [
        { staff_id: "s1", date: "2026-05-10", type: "peer" },
        { staff_id: "s1", date: "2026-04-15", type: "manager" },
        { staff_id: "s1", date: "2026-03-20", type: "award" },
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", overall_score: 9, date: "2026-05-15" }),
      ],
    }));
    const jane = result.staff_profiles.find((p) => p.staff_id === "s1");
    expect(jane!.protective_factors.length).toBeGreaterThan(0);
    expect(jane!.recognition_count_90d).toBe(3);
  });

  it("includes debrief count in staff profile", () => {
    const result = computeStaffWellbeing(baseInput({
      debrief_records: [
        { date: "2026-05-20", staff_involved: ["s1", "s2"], emotional_impact: "moderate", key_themes: ["restraint"], support_offered: ["supervision"], follow_up_needed: false },
        { date: "2026-05-10", staff_involved: ["s1"], emotional_impact: "severe", key_themes: ["self-harm"], support_offered: ["counselling"], follow_up_needed: true },
      ],
    }));
    const jane = result.staff_profiles.find((p) => p.staff_id === "s1");
    expect(jane!.debrief_count_90d).toBe(2);
  });

  it("generates critical insight when multiple staff at risk", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [
        makeStaff({ id: "s1", name: "Jane" }),
        makeStaff({ id: "s2", name: "Tom" }),
        makeStaff({ id: "s3", name: "Sara" }),
      ],
      shifts: [
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s1", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 90 })),
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s2", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 90 })),
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s3", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 90 })),
      ],
      supervisions: [],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, date_started: "2026-04-01" }),
        makeSickness({ staff_id: "s2", total_days: 11, date_started: "2026-04-05" }),
        makeSickness({ staff_id: "s3", total_days: 10, date_started: "2026-04-10" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s2", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s3", overall_score: 3 }),
      ],
    }));
    const criticalInsight = result.insights.find((i) => i.severity === "critical");
    expect(criticalInsight).toBeDefined();
  });

  it("generates positive insight when no staff at risk", () => {
    const result = computeStaffWellbeing(baseInput({
      recognition_records: [
        { staff_id: "s1", date: "2026-05-10", type: "peer" },
        { staff_id: "s2", date: "2026-05-12", type: "manager" },
        { staff_id: "s3", date: "2026-05-14", type: "award" },
      ],
    }));
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("excludes inactive staff from profiles", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [
        makeStaff({ id: "s1", name: "Jane", is_active: true }),
        makeStaff({ id: "s2", name: "Tom", is_active: false }),
      ],
    }));
    expect(result.staff_profiles).toHaveLength(1);
    expect(result.staff_profiles[0].staff_id).toBe("s1");
    expect(result.workforce_pulse.total_active_staff).toBe(1);
  });

  it("handles empty input gracefully", () => {
    const result = computeStaffWellbeing({
      today: "2026-05-26",
      home_name: "Chamberlain House",
      staff: [],
      shifts: [],
      leave_requests: [],
      supervisions: [],
      sickness_records: [],
      wellbeing_checks: [],
      debrief_records: [],
      recognition_records: [],
      grievance_records: [],
      incidents: [],
    });
    expect(result.staff_profiles).toHaveLength(0);
    expect(result.workforce_pulse.total_active_staff).toBe(0);
    expect(result.home_resilience.score).toBeGreaterThanOrEqual(0);
    expect(result.sickness_analysis.total_days_lost_90d).toBe(0);
  });

  it("detects fragile or at_risk resilience when workforce is strained", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [
        makeStaff({ id: "s1", name: "Jane" }),
        makeStaff({ id: "s2", name: "Tom" }),
        makeStaff({ id: "s3", name: "Sara" }),
      ],
      shifts: [
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s1", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 120 })),
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s2", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 120 })),
        ...Array.from({ length: 25 }, (_, i) => makeShift({ staff_id: "s3", date: `2026-05-${String(i + 1).padStart(2, "0")}`, overtime_minutes: 120 })),
      ],
      supervisions: [],
      sickness_records: [
        makeSickness({ staff_id: "s1", total_days: 12, category: "stress", reason: "Stress", date_started: "2026-04-01" }),
        makeSickness({ staff_id: "s2", total_days: 10, category: "stress", reason: "Stress", date_started: "2026-04-05" }),
        makeSickness({ staff_id: "s3", total_days: 8, category: "mental_health", reason: "Anxiety", date_started: "2026-04-10" }),
      ],
      wellbeing_checks: [
        makeWellbeingCheck({ staff_id: "s1", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s2", overall_score: 3 }),
        makeWellbeingCheck({ staff_id: "s3", overall_score: 3 }),
      ],
      grievance_records: [
        { staff_id: "s1", date: "2026-05-10", status: "open", category: "workload" },
        { staff_id: "s2", date: "2026-05-12", status: "open", category: "management" },
      ],
    }));
    expect(["fragile", "at_risk"]).toContain(result.home_resilience.level);
    expect(result.home_resilience.score).toBeLessThan(55);
    expect(result.home_resilience.staff_at_risk_count).toBeGreaterThanOrEqual(2);
  });

  it("includes recognition-to-grievance ratio in resilience", () => {
    const result = computeStaffWellbeing(baseInput({
      recognition_records: [
        { staff_id: "s1", date: "2026-05-10", type: "peer" },
        { staff_id: "s2", date: "2026-05-12", type: "manager" },
        { staff_id: "s1", date: "2026-04-15", type: "award" },
      ],
      grievance_records: [
        { staff_id: "s3", date: "2026-05-08", status: "resolved", category: "workload" },
      ],
    }));
    expect(result.home_resilience.recognition_to_grievance_ratio).toBe("3:1");
  });

  it("handles open grievances as priority action", () => {
    const result = computeStaffWellbeing(baseInput({
      grievance_records: [
        { staff_id: "s1", date: "2026-05-10", status: "open", category: "bullying" },
        { staff_id: "s2", date: "2026-05-12", status: "pending", category: "workload" },
      ],
    }));
    const grvAction = result.priority_actions.find((a) => a.action.includes("grievance"));
    expect(grvAction).toBeDefined();
    expect(grvAction!.severity).toBe("high");
  });

  it("identifies severe debrief follow-ups in insights", () => {
    const result = computeStaffWellbeing(baseInput({
      debrief_records: [
        {
          date: "2026-05-20",
          staff_involved: ["s1"],
          emotional_impact: "severe",
          key_themes: ["restraint"],
          support_offered: ["counselling"],
          follow_up_needed: true,
        },
      ],
    }));
    const debriefInsight = result.insights.find((i) => i.text.includes("debrief"));
    expect(debriefInsight).toBeDefined();
    expect(debriefInsight!.severity).toBe("warning");
  });

  it("generates medium warning for new staff with overdue supervision", () => {
    const result = computeStaffWellbeing(baseInput({
      staff: [makeStaff({ id: "s1", name: "New Starter", start_date: "2026-03-01" })],
      shifts: Array.from({ length: 10 }, (_, i) =>
        makeShift({ staff_id: "s1", date: `2026-05-${String(i + 10).padStart(2, "0")}` }),
      ),
      supervisions: [],
      wellbeing_checks: [],
    }));
    const warning = result.early_warnings.find(
      (w) => w.domain === "supervision" && w.severity === "medium",
    );
    expect(warning).toBeDefined();
    expect(warning!.warning).toContain("New staff");
  });
});
