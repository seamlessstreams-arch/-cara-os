// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWorkforceIntelligence,
  daysBetween,
  isDBSExpired,
  computeBradfordFactor,
  type StaffInput,
  type TrainingInput,
  type SupervisionInput,
  type ShiftInput,
  type LeaveInput,
  type WorkforceEngineInput,
} from "../workforce-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffInput> = {}): StaffInput {
  return {
    id: "staff_test",
    full_name: "Test Staff",
    role: "rsw",
    employment_type: "full_time",
    employment_status: "active",
    start_date: "2024-01-01",
    probation_end_date: null,
    contracted_hours: 37.5,
    dbs_number: "DBS123",
    dbs_issue_date: "2025-01-01",
    dbs_update_service: false,
    next_supervision_due: "2026-06-01",
    next_appraisal_due: "2026-12-01",
    is_active: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingInput> = {}): TrainingInput {
  return {
    id: "tr_test",
    staff_id: "staff_test",
    course_name: "Test Course",
    category: "safeguarding",
    completed_date: "2026-01-01",
    expiry_date: "2027-01-01",
    status: "compliant",
    is_mandatory: true,
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SupervisionInput> = {}): SupervisionInput {
  return {
    id: "sup_test",
    staff_id: "staff_test",
    scheduled_date: "2026-05-15",
    actual_date: "2026-05-15",
    status: "completed",
    type: "regular",
    wellbeing_score: 4,
    ...overrides,
  };
}

function makeShift(overrides: Partial<ShiftInput> = {}): ShiftInput {
  return {
    id: "shift_test",
    staff_id: "staff_test",
    date: "2026-05-23",
    shift_type: "day",
    start_time: "07:00",
    end_time: "15:00",
    status: "completed",
    overtime_minutes: 0,
    ...overrides,
  };
}

function makeLeave(overrides: Partial<LeaveInput> = {}): LeaveInput {
  return {
    id: "leave_test",
    staff_id: "staff_test",
    leave_type: "annual_leave",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
    total_days: 5,
    status: "approved",
    ...overrides,
  };
}

// ── daysBetween ─────────────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns positive for future date", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  it("returns negative for past date", () => {
    expect(daysBetween("2026-05-10", "2026-05-01")).toBe(-9);
  });

  it("returns 0 for same date", () => {
    expect(daysBetween("2026-05-23", "2026-05-23")).toBe(0);
  });
});

// ── isDBSExpired ────────────────────────────────────────────────────────────

describe("isDBSExpired", () => {
  it("returns false when on Update Service", () => {
    expect(isDBSExpired("2020-01-01", true, "2026-05-23")).toBe(false);
  });

  it("returns true when no issue date", () => {
    expect(isDBSExpired(null, false, "2026-05-23")).toBe(true);
  });

  it("returns false when within 3 years", () => {
    expect(isDBSExpired("2025-01-01", false, "2026-05-23")).toBe(false);
  });

  it("returns true when over 3 years", () => {
    expect(isDBSExpired("2022-01-01", false, "2026-05-23")).toBe(true);
  });

  it("returns false at exactly 3 years", () => {
    // 1095 days from 2023-05-23 = 2026-05-22 (day 1095)
    expect(isDBSExpired("2023-05-23", false, "2026-05-22")).toBe(false);
  });

  it("returns true at 3 years + 1 day", () => {
    expect(isDBSExpired("2023-05-23", false, "2026-05-24")).toBe(true);
  });
});

// ── computeBradfordFactor ───────────────────────────────────────────────────

describe("computeBradfordFactor", () => {
  it("returns 0 for no instances", () => {
    expect(computeBradfordFactor(0, 0)).toBe(0);
  });

  it("calculates S² × D correctly", () => {
    expect(computeBradfordFactor(3, 5)).toBe(45); // 3² × 5 = 45
  });

  it("penalises frequent short absences", () => {
    // 5 instances of 1 day = 5² × 5 = 125
    expect(computeBradfordFactor(5, 5)).toBe(125);
    // 1 instance of 5 days = 1² × 5 = 5
    expect(computeBradfordFactor(1, 5)).toBe(5);
  });
});

// ── computeWorkforceIntelligence — Empty ────────────────────────────────────

describe("computeWorkforceIntelligence — empty inputs", () => {
  it("handles empty arrays gracefully", () => {
    const result = computeWorkforceIntelligence({
      staff: [],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today: "2026-05-23",
    });

    expect(result.profile.total_staff).toBe(0);
    expect(result.profile.active_staff).toBe(0);
    // An empty register is a gap, not full compliance
    expect(result.profile.training_compliance_rate).toBeNull();
    expect(result.profile.supervision_compliance_rate).toBeNull();
    expect(result.profile.dbs_compliance_rate).toBeNull();
    expect(result.staffing.coverage_rate).toBeNull();
    expect(result.training).toHaveLength(0);
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("100% mandatory training"))).toBe(false);
  });
});

// ── Profile Computation ─────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — profile", () => {
  const today = "2026-05-23";

  it("counts staff by employment type", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", employment_type: "full_time" }),
        makeStaff({ id: "s2", employment_type: "full_time" }),
        makeStaff({ id: "s3", employment_type: "part_time" }),
        makeStaff({ id: "s4", employment_type: "bank" }),
        makeStaff({ id: "s5", employment_type: "agency" }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.profile.active_staff).toBe(5);
    expect(result.profile.full_time).toBe(2);
    expect(result.profile.part_time).toBe(1);
    expect(result.profile.bank_agency).toBe(2);
  });

  it("identifies staff on probation", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", probation_end_date: "2026-06-15" }), // in future
        makeStaff({ id: "s2", probation_end_date: "2026-04-01" }), // passed
        makeStaff({ id: "s3", probation_end_date: null }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.profile.on_probation).toBe(1);
  });

  it("counts staff on leave today", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        makeLeave({ staff_id: "s1", leave_type: "sick", start_date: "2026-05-23", end_date: "2026-05-24" }),
      ],
      today,
    });

    expect(result.profile.staff_on_leave_today).toBe(1);
  });

  it("counts staff on shift today", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })],
      training: [],
      supervisions: [],
      shifts: [
        makeShift({ staff_id: "s1", date: "2026-05-23", status: "confirmed" }),
        makeShift({ staff_id: "s2", date: "2026-05-23", status: "cancelled" }),
      ],
      leave: [],
      today,
    });

    expect(result.profile.staff_on_shift_today).toBe(1); // only s1 (s2 cancelled)
  });

  it("calculates average tenure", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", start_date: "2025-05-23" }), // 12 months
        makeStaff({ id: "s2", start_date: "2024-05-23" }), // 24 months
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.profile.average_tenure_months).toBe(18); // (12+24)/2
  });
});

// ── Training Compliance ─────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — training", () => {
  const today = "2026-05-23";

  it("calculates per-category compliance", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })],
      training: [
        makeTraining({ id: "t1", staff_id: "s1", category: "safeguarding", status: "compliant" }),
        makeTraining({ id: "t2", staff_id: "s2", category: "safeguarding", status: "expired" }),
        makeTraining({ id: "t3", staff_id: "s1", category: "first_aid", status: "compliant" }),
        makeTraining({ id: "t4", staff_id: "s2", category: "first_aid", status: "expiring_soon" }),
      ],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    const safeguarding = result.training.find((t) => t.category === "safeguarding");
    expect(safeguarding).toBeDefined();
    expect(safeguarding!.compliant).toBe(1);
    expect(safeguarding!.expired).toBe(1);
    expect(safeguarding!.compliance_rate).toBe(50); // 1/2

    const firstAid = result.training.find((t) => t.category === "first_aid");
    expect(firstAid!.compliance_rate).toBe(100); // both compliant or expiring_soon
  });

  it("sorts categories by compliance rate (worst first)", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [
        makeTraining({ id: "t1", category: "safeguarding", status: "compliant" }),
        makeTraining({ id: "t2", category: "data_protection", status: "expired" }),
      ],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.training[0].category).toBe("data_protection");
    expect(result.training[0].compliance_rate).toBe(0);
  });

  it("only counts mandatory training", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [
        makeTraining({ id: "t1", is_mandatory: true, status: "expired" }),
        makeTraining({ id: "t2", is_mandatory: false, status: "expired" }),
      ],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.profile.training_compliance_rate).toBe(0); // only 1 mandatory, expired
    expect(result.training).toHaveLength(1); // Only mandatory category shown
  });
});

// ── Supervision Compliance ──────────────────────────────────────────────────

describe("computeWorkforceIntelligence — supervision", () => {
  const today = "2026-05-23";

  it("identifies overdue staff", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", full_name: "Overdue Staff", next_supervision_due: "2026-05-10" }), // 13 days overdue
        makeStaff({ id: "s2", full_name: "Current Staff", next_supervision_due: "2026-06-01" }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.supervision.overdue).toBe(1);
    expect(result.supervision.staff_overdue[0].staff_name).toBe("Overdue Staff");
    expect(result.supervision.staff_overdue[0].days_overdue).toBe(13);
  });

  it("identifies staff due within 7 days", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", next_supervision_due: "2026-05-28" }), // 5 days away
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.supervision.due_within_7_days).toBe(1);
    expect(result.supervision.up_to_date).toBe(1); // Still counts as up to date
  });

  it("excludes bank/agency from supervision requirements", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", employment_type: "bank", next_supervision_due: null }),
        makeStaff({ id: "s2", employment_type: "full_time", next_supervision_due: "2026-06-01" }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.supervision.total_staff_requiring).toBe(1);
  });

  it("calculates average wellbeing score", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [
        makeSupervision({ id: "sup1", wellbeing_score: 3, actual_date: "2026-05-10" }),
        makeSupervision({ id: "sup2", wellbeing_score: 5, actual_date: "2026-04-15" }),
      ],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.supervision.avg_wellbeing_score).toBe(4);
  });
});

// ── Staffing Coverage ───────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — staffing coverage", () => {
  // May 23 2026 is a Friday, week starts Monday May 19
  const today = "2026-05-23";

  it("calculates coverage rate from this week's shifts", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })],
      training: [],
      supervisions: [],
      shifts: [
        makeShift({ id: "sh1", date: "2026-05-19", status: "completed" }),
        makeShift({ id: "sh2", date: "2026-05-20", status: "confirmed" }),
        makeShift({ id: "sh3", date: "2026-05-21", status: "no_show" }),
        makeShift({ id: "sh4", date: "2026-05-22", status: "completed" }),
      ],
      leave: [],
      today,
    });

    expect(result.staffing.shifts_this_week).toBe(4);
    expect(result.staffing.shifts_filled).toBe(3); // 3 non-cancelled/non-no_show
    expect(result.staffing.shifts_unfilled).toBe(1);
    expect(result.staffing.coverage_rate).toBe(75);
  });

  it("calculates overtime this month", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [
        makeShift({ id: "sh1", date: "2026-05-10", overtime_minutes: 60 }),
        makeShift({ id: "sh2", date: "2026-05-15", overtime_minutes: 90 }),
      ],
      leave: [],
      today,
    });

    expect(result.staffing.overtime_hours_this_month).toBe(3); // (60+90)/60 = 2.5 rounded to 3
  });

  it("counts no-shows this month", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [
        makeShift({ id: "sh1", date: "2026-05-10", status: "no_show" }),
        makeShift({ id: "sh2", date: "2026-05-20", status: "no_show" }),
        makeShift({ id: "sh3", date: "2026-05-22", status: "completed" }),
      ],
      leave: [],
      today,
    });

    expect(result.staffing.no_shows_this_month).toBe(2);
  });
});

// ── DBS Compliance ──────────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — DBS compliance", () => {
  const today = "2026-05-23";

  it("counts valid DBS (within 3 years)", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", dbs_issue_date: "2025-01-01", dbs_update_service: false }),
        makeStaff({ id: "s2", dbs_issue_date: "2024-06-01", dbs_update_service: false }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.dbs.valid_dbs).toBe(2);
    expect(result.dbs.compliance_rate).toBe(100);
  });

  it("counts Update Service enrolled as always valid", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", dbs_issue_date: "2020-01-01", dbs_update_service: true }), // Old but on US
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.dbs.valid_dbs).toBe(1);
    expect(result.dbs.update_service_enrolled).toBe(1);
    expect(result.dbs.expired_or_missing).toBe(0);
  });

  it("identifies expired DBS (over 3 years)", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", full_name: "Old DBS", dbs_issue_date: "2022-01-01", dbs_update_service: false }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.dbs.expired_or_missing).toBe(1);
    expect(result.dbs.staff_needing_renewal[0].staff_name).toBe("Old DBS");
  });

  it("identifies missing DBS", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", full_name: "No DBS", dbs_number: null, dbs_issue_date: null, dbs_update_service: false }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    expect(result.dbs.expired_or_missing).toBe(1);
  });
});

// ── Sickness Patterns ───────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — sickness", () => {
  const today = "2026-05-23";

  it("calculates sick days this month", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        makeLeave({ staff_id: "s1", leave_type: "sick", start_date: "2026-05-10", end_date: "2026-05-12", total_days: 3 }),
      ],
      today,
    });

    expect(result.sickness.total_sick_days_this_month).toBe(3);
    expect(result.sickness.staff_with_sickness).toBe(1);
  });

  it("calculates Bradford Factor alerts", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1", full_name: "Frequent Sick" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-05-01", end_date: "2026-05-01", total_days: 1 }),
        makeLeave({ id: "l2", staff_id: "s1", leave_type: "sick", start_date: "2026-05-08", end_date: "2026-05-08", total_days: 1 }),
        makeLeave({ id: "l3", staff_id: "s1", leave_type: "sick", start_date: "2026-05-15", end_date: "2026-05-16", total_days: 2 }),
      ],
      today,
    });

    // 3 instances × 4 days = 3² × 4 = 36... wait no.
    // 3 instances, total days = 1+1+2 = 4, BF = 9 × 4 = 36 (under threshold 50)
    // Let me adjust to trigger alert
    expect(result.sickness.bradford_factor_alerts).toHaveLength(0); // 36 < 50
  });

  it("triggers Bradford Factor alert above threshold", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1", full_name: "Very Sick" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-04-01", end_date: "2026-04-01", total_days: 1 }),
        makeLeave({ id: "l2", staff_id: "s1", leave_type: "sick", start_date: "2026-04-10", end_date: "2026-04-11", total_days: 2 }),
        makeLeave({ id: "l3", staff_id: "s1", leave_type: "sick", start_date: "2026-04-20", end_date: "2026-04-21", total_days: 2 }),
        makeLeave({ id: "l4", staff_id: "s1", leave_type: "sick", start_date: "2026-05-05", end_date: "2026-05-06", total_days: 2 }),
      ],
      today,
    });

    // 4 instances, 7 days = 4² × 7 = 112 (above 50)
    expect(result.sickness.bradford_factor_alerts).toHaveLength(1);
    expect(result.sickness.bradford_factor_alerts[0].staff_name).toBe("Very Sick");
    expect(result.sickness.bradford_factor_alerts[0].factor).toBe(112);
  });

  it("detects increasing sickness trend", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        // This month: 5 days
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-05-05", end_date: "2026-05-09", total_days: 5 }),
        // Last month: 1 day
        makeLeave({ id: "l2", staff_id: "s1", leave_type: "sick", start_date: "2026-04-15", end_date: "2026-04-15", total_days: 1 }),
      ],
      today,
    });

    expect(result.sickness.trend).toBe("increasing");
  });

  it("ignores non-sick leave", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [
        makeLeave({ staff_id: "s1", leave_type: "annual_leave", start_date: "2026-05-10", end_date: "2026-05-14", total_days: 5 }),
      ],
      today,
    });

    expect(result.sickness.total_sick_days_this_month).toBe(0);
  });
});

// ── Cara Insights ───────────────────────────────────────────────────────────

describe("computeWorkforceIntelligence — Cara insights", () => {
  const today = "2026-05-23";

  it("generates critical insight for expired training", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [
        makeTraining({ id: "t1", staff_id: "s1", category: "safeguarding", status: "expired" }),
      ],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    const trainInsight = result.insights.find((i) => i.text.includes("mandatory training"));
    expect(trainInsight).toBeDefined();
    expect(trainInsight!.severity).toBe("critical");
  });

  it("generates positive insight for 100% training compliance", () => {
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [
        makeTraining({ id: "t1", staff_id: "s1", category: "safeguarding", status: "compliant" }),
      ],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    const trainInsight = result.insights.find((i) => i.text.includes("100% mandatory training"));
    expect(trainInsight).toBeDefined();
    expect(trainInsight!.severity).toBe("positive");
  });

  it("generates warning for overdue supervisions", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", full_name: "Late Staff", next_supervision_due: "2026-05-01" }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    const supInsight = result.insights.find((i) => i.text.includes("overdue for supervision"));
    expect(supInsight).toBeDefined();
    expect(supInsight!.severity).toBe("warning");
  });

  it("generates critical insight for DBS issues", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", dbs_issue_date: null, dbs_update_service: false }),
      ],
      training: [],
      supervisions: [],
      shifts: [],
      leave: [],
      today,
    });

    const dbsInsight = result.insights.find((i) => i.text.includes("DBS"));
    expect(dbsInsight).toBeDefined();
    expect(dbsInsight!.severity).toBe("critical");
  });

  it("generates warning for low staffing coverage", () => {
    // Week of May 19-25, 2026
    const result = computeWorkforceIntelligence({
      staff: [makeStaff({ id: "s1" })],
      training: [],
      supervisions: [],
      shifts: [
        makeShift({ id: "sh1", date: "2026-05-19", status: "completed" }),
        makeShift({ id: "sh2", date: "2026-05-20", status: "no_show" }),
        makeShift({ id: "sh3", date: "2026-05-21", status: "cancelled" }),
        makeShift({ id: "sh4", date: "2026-05-22", status: "completed" }),
        makeShift({ id: "sh5", date: "2026-05-23", status: "cancelled" }),
      ],
      leave: [],
      today,
    });

    // 2 filled, 3 unfilled = 40% coverage
    const covInsight = result.insights.find((i) => i.text.includes("coverage"));
    expect(covInsight).toBeDefined();
    expect(covInsight!.severity).toBe("warning");
  });

  it("generates positive insight when all compliance high", () => {
    const result = computeWorkforceIntelligence({
      staff: [
        makeStaff({ id: "s1", dbs_issue_date: "2025-01-01", dbs_update_service: true, next_supervision_due: "2026-06-15" }),
      ],
      training: [
        makeTraining({ id: "t1", staff_id: "s1", status: "compliant" }),
      ],
      supervisions: [],
      shifts: [
        makeShift({ id: "sh1", date: "2026-05-19", status: "completed" }),
        makeShift({ id: "sh2", date: "2026-05-20", status: "completed" }),
      ],
      leave: [],
      today,
    });

    const posInsight = result.insights.find((i) => i.text.includes("Workforce compliance strong"));
    expect(posInsight).toBeDefined();
    expect(posInsight!.severity).toBe("positive");
  });
});

// ── Full Integration Test — Chamberlain House ───────────────────────────────────────

describe("computeWorkforceIntelligence — Chamberlain House integration", () => {
  const today = "2026-05-23";

  const oakHouseInput: WorkforceEngineInput = {
    staff: [
      makeStaff({ id: "staff_darren", full_name: "Darren Laville", role: "registered_manager", employment_type: "full_time", start_date: "2023-06-01", dbs_issue_date: "2024-01-15", dbs_update_service: true, next_supervision_due: "2026-06-01" }),
      makeStaff({ id: "staff_ryan", full_name: "Ryan Forsythe", role: "deputy_manager", employment_type: "full_time", start_date: "2023-09-01", dbs_issue_date: "2023-10-01", dbs_update_service: true, next_supervision_due: "2026-05-28" }),
      makeStaff({ id: "staff_edward", full_name: "Edward Asante", role: "rsw", employment_type: "full_time", start_date: "2024-01-15", dbs_issue_date: "2024-02-01", dbs_update_service: false, next_supervision_due: "2026-06-05" }),
      makeStaff({ id: "staff_anna", full_name: "Anna Edwards", role: "rsw", employment_type: "full_time", start_date: "2024-03-01", dbs_issue_date: "2024-03-15", dbs_update_service: false, next_supervision_due: "2026-06-10" }),
      makeStaff({ id: "staff_chervelle", full_name: "Chervelle James", role: "rsw", employment_type: "part_time", start_date: "2024-06-01", dbs_issue_date: "2024-07-01", dbs_update_service: false, next_supervision_due: "2026-05-30" }),
      makeStaff({ id: "staff_diane", full_name: "Diane McFarlane", role: "rsw", employment_type: "full_time", start_date: "2024-09-01", dbs_issue_date: "2024-09-15", dbs_update_service: false, next_supervision_due: "2026-06-15" }),
      makeStaff({ id: "staff_lackson", full_name: "Lackson Phiri", role: "rsw", employment_type: "part_time", start_date: "2025-01-15", dbs_issue_date: "2025-02-01", dbs_update_service: false, next_supervision_due: "2026-06-01" }),
      makeStaff({ id: "staff_mirela", full_name: "Mirela Ionescu", role: "rsw", employment_type: "full_time", start_date: "2026-04-01", probation_end_date: "2026-07-01", dbs_issue_date: "2026-04-01", dbs_update_service: false, next_supervision_due: "2026-05-25" }),
      makeStaff({ id: "staff_bianca", full_name: "Bianca Thompson", role: "rsw", employment_type: "bank", start_date: "2025-06-01", dbs_issue_date: "2025-06-15", dbs_update_service: false, next_supervision_due: null }),
    ],
    training: [
      makeTraining({ id: "t1", staff_id: "staff_edward", category: "safeguarding", status: "compliant" }),
      makeTraining({ id: "t2", staff_id: "staff_edward", category: "first_aid", status: "expiring_soon" }),
      makeTraining({ id: "t3", staff_id: "staff_anna", category: "data_protection", status: "expired" }),
      makeTraining({ id: "t4", staff_id: "staff_anna", category: "first_aid", status: "expiring_soon" }),
      makeTraining({ id: "t5", staff_id: "staff_edward", category: "data_protection", status: "expired" }),
      makeTraining({ id: "t6", staff_id: "staff_diane", category: "restraint", status: "compliant" }),
      makeTraining({ id: "t7", staff_id: "staff_mirela", category: "fire_safety", status: "not_started" }),
      makeTraining({ id: "t8", staff_id: "staff_chervelle", category: "medication", status: "compliant" }),
      makeTraining({ id: "t9", staff_id: "staff_ryan", category: "safeguarding", status: "compliant" }),
      makeTraining({ id: "t10", staff_id: "staff_darren", category: "safeguarding", status: "compliant" }),
      makeTraining({ id: "t11", staff_id: "staff_bianca", category: "data_protection", status: "expired" }),
    ],
    supervisions: [
      makeSupervision({ id: "sup1", staff_id: "staff_edward", actual_date: "2026-05-10", wellbeing_score: 4 }),
      makeSupervision({ id: "sup2", staff_id: "staff_anna", actual_date: "2026-05-05", wellbeing_score: 3 }),
      makeSupervision({ id: "sup3", staff_id: "staff_ryan", actual_date: "2026-04-28", wellbeing_score: 4 }),
      makeSupervision({ id: "sup4", staff_id: "staff_edward", actual_date: "2026-04-10", wellbeing_score: 4 }),
    ],
    shifts: [
      // This week (May 19-25)
      makeShift({ id: "sh1", staff_id: "staff_edward", date: "2026-05-19", status: "completed" }),
      makeShift({ id: "sh2", staff_id: "staff_anna", date: "2026-05-19", status: "completed" }),
      makeShift({ id: "sh3", staff_id: "staff_edward", date: "2026-05-20", status: "completed" }),
      makeShift({ id: "sh4", staff_id: "staff_chervelle", date: "2026-05-20", status: "completed" }),
      makeShift({ id: "sh5", staff_id: "staff_ryan", date: "2026-05-21", status: "completed" }),
      makeShift({ id: "sh6", staff_id: "staff_diane", date: "2026-05-21", status: "completed" }),
      makeShift({ id: "sh7", staff_id: "staff_darren", date: "2026-05-22", status: "completed" }),
      makeShift({ id: "sh8", staff_id: "staff_edward", date: "2026-05-22", status: "completed", overtime_minutes: 30 }),
      makeShift({ id: "sh9", staff_id: "staff_anna", date: "2026-05-23", status: "confirmed" }),
      makeShift({ id: "sh10", staff_id: "staff_ryan", date: "2026-05-23", status: "confirmed" }),
    ],
    leave: [
      makeLeave({ id: "l1", staff_id: "staff_diane", leave_type: "sick", start_date: "2026-05-23", end_date: "2026-05-24", total_days: 2 }),
    ],
    today,
  };

  it("produces correct profile for Chamberlain House", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    expect(result.profile.total_staff).toBe(9);
    expect(result.profile.active_staff).toBe(9);
    expect(result.profile.full_time).toBe(6);
    expect(result.profile.part_time).toBe(2);
    expect(result.profile.bank_agency).toBe(1);
    expect(result.profile.on_probation).toBe(1); // Mirela
    expect(result.profile.staff_on_leave_today).toBe(1); // Diane
    expect(result.profile.staff_on_shift_today).toBe(2); // Anna, Ryan
    expect(result.profile.dbs_compliance_rate).toBe(100); // All valid
  });

  it("identifies expired training correctly", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    const dataProtection = result.training.find((t) => t.category === "data_protection");
    expect(dataProtection).toBeDefined();
    expect(dataProtection!.expired).toBe(3); // Anna, Edward, Bianca
    expect(dataProtection!.compliance_rate).toBe(0);
  });

  it("supervision compliance includes all permanent staff", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    // 8 staff require supervision (all except Bianca who is bank)
    expect(result.supervision.total_staff_requiring).toBe(8);
    expect(result.supervision.overdue).toBe(0); // All have future due dates
  });

  it("staffing coverage shows full week data", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    expect(result.staffing.shifts_this_week).toBe(10);
    expect(result.staffing.shifts_filled).toBe(10);
    expect(result.staffing.coverage_rate).toBe(100);
  });

  it("generates critical insight for expired training", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    const trainInsight = result.insights.find((i) => i.text.includes("mandatory training") && i.text.includes("expired"));
    expect(trainInsight).toBeDefined();
    expect(trainInsight!.severity).toBe("critical");
  });

  it("generates multiple insights", () => {
    const result = computeWorkforceIntelligence(oakHouseInput);

    expect(result.insights.length).toBeGreaterThanOrEqual(2);
  });
});
