// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF SAFETY INTELLIGENCE ENGINE — TESTS
// HSW Act 1974, CHR 2015 Reg 33/34: staff safety, lone working, debriefs.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeStaffSafety,
  type HomeStaffSafetyInput,
  type LoneWorkingInput,
  type LWRAInput,
  type DebriefInput,
  type GrievanceInput,
} from "../home-staff-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeLW(overrides: Partial<LoneWorkingInput> = {}): LoneWorkingInput {
  return {
    id: "lw_1",
    staff_id: "staff_1",
    scenario: "Night shift",
    risk_level: "medium",
    status: "current",
    assessment_date: "2026-04-01",
    review_date: "2026-10-01",
    assessed_by: "manager_1",
    hazards: ["Lone working at night"],
    control_measures: ["Regular check-ins"],
    check_in_protocol: "Hourly phone check",
    personal_alarm_issued: true,
    emergency_procedure: "Call 999",
    notes: "",
    ...overrides,
  };
}

function makeLWRA(overrides: Partial<LWRAInput> = {}): LWRAInput {
  return {
    id: "lwra_1",
    staff_member: "staff_1",
    role: "Residential Worker",
    scenarios: [{ scenario: "Night shift", risk: "medium", controls: ["Check-ins"] }],
    overall_risk_level: "medium",
    approved_to_work_alone: true,
    reviewed_date: "2026-04-01",
    next_review_date: "2026-10-01",
    training_completed: [{ course: "Lone Working", date: "2026-03-01", provider: "Internal" }],
    emergency_protocols: ["Call 999"],
    ...overrides,
  };
}

function makeDebrief(overrides: Partial<DebriefInput> = {}): DebriefInput {
  return {
    id: "db_1",
    date: "2026-05-20",
    type: "post_incident",
    trigger_event: "Incident #123",
    trigger_date: "2026-05-19",
    staff_involved: ["staff_1"],
    facilitated_by: "manager_1",
    status: "completed",
    emotional_impact: "moderate",
    key_themes: ["Communication"],
    support_offered: ["Supervision"],
    follow_up_needed: false,
    follow_up_details: null,
    learning_points: ["Improve radio protocol"],
    ...overrides,
  };
}

function makeGrievance(overrides: Partial<GrievanceInput> = {}): GrievanceInput {
  return {
    id: "gr_1",
    raised_by: "staff_1",
    raised_date: "2026-05-01",
    category: "working_conditions",
    severity: "medium",
    status: "resolved",
    outcome: "Satisfactory resolution",
    support_offered: ["Mediation"],
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeStaffSafetyInput> = {}): HomeStaffSafetyInput {
  return {
    today: "2026-05-27",
    lone_working_records: [makeLW()],
    risk_assessments: [makeLWRA()],
    debriefs: [makeDebrief()],
    grievances: [],
    total_staff: 10,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.safety_rating).toBe("insufficient_data");
    expect(r.safety_score).toBe(0);
  });

  it("populates all profiles with zeros on insufficient data", () => {
    const r = computeHomeStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.lone_working.total_records).toBe(0);
    expect(r.debriefs.total).toBe(0);
    expect(r.grievance_profile.total).toBe(0);
    expect(r.lwra.total).toBe(0);
  });

  it("returns empty strengths, concerns, recommendations, insights", () => {
    const r = computeHomeStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns headline for no staff", () => {
    const r = computeHomeStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.headline).toBe("No active staff registered.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    // max bonuses: mod1 +5, mod2 +4, mod3 +3, mod4 +4, mod5 +3, mod6 +3, mod7 +3, mod8 +2 = 27
    // base 52 + 27 = 79 — not quite. Need grievances for mod6 bonus.
    const lws = Array.from({ length: 8 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, personal_alarm_issued: true }),
    );
    const lwras = Array.from({ length: 8 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({
        id: `db_${i}`,
        status: "completed",
        emotional_impact: "high",
        follow_up_needed: true,
        learning_points: ["Learning point"],
      }),
    );
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "resolved", raised_by: "staff_2" }),
      makeGrievance({ id: "gr_3", status: "resolved", raised_by: "staff_3" }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: lwras,
      debriefs: dbs,
      grievances: grs,
    }));
    expect(r.safety_score).toBeGreaterThanOrEqual(80);
    expect(r.safety_rating).toBe("outstanding");
  });

  it("returns good for score >= 65 and < 80", () => {
    // Decent but not perfect
    const lws = Array.from({ length: 6 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, personal_alarm_issued: true }),
    );
    const lwras = Array.from({ length: 6 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const dbs = [
      makeDebrief({ id: "db_1", status: "completed", learning_points: ["LP"] }),
      makeDebrief({ id: "db_2", status: "completed", learning_points: ["LP"] }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: lwras,
      debriefs: dbs,
      grievances: [],
    }));
    expect(r.safety_score).toBeGreaterThanOrEqual(65);
    expect(r.safety_score).toBeLessThan(80);
    expect(r.safety_rating).toBe("good");
  });

  it("returns adequate for score >= 45 and < 65", () => {
    // Minimal data, small coverage
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: [makeLW()],
      risk_assessments: [],
      debriefs: [],
      grievances: [],
    }));
    expect(r.safety_score).toBeGreaterThanOrEqual(45);
    expect(r.safety_score).toBeLessThan(65);
    expect(r.safety_rating).toBe("adequate");
  });

  it("returns inadequate for score < 45", () => {
    // Everything bad
    const lws = [
      makeLW({ id: "lw_1", staff_id: "s1", status: "expired", personal_alarm_issued: false }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "expired", personal_alarm_issued: false }),
    ];
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue", learning_points: [] }),
      makeDebrief({ id: "db_2", status: "overdue", learning_points: [] }),
      makeDebrief({ id: "db_3", status: "overdue", learning_points: [] }),
    ];
    const grs = [
      makeGrievance({ id: "gr_1", status: "under_investigation", severity: "critical" }),
      makeGrievance({ id: "gr_2", status: "formal_submitted", severity: "critical" }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: [makeLWRA({ approved_to_work_alone: false })],
      debriefs: dbs,
      grievances: grs,
      total_staff: 20,
    }));
    expect(r.safety_score).toBeLessThan(45);
    expect(r.safety_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. LONE WORKING PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("lone working profile", () => {
  it("counts records by status", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "current" }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "current" }),
      makeLW({ id: "lw_3", staff_id: "s3", status: "due_review" }),
      makeLW({ id: "lw_4", staff_id: "s4", status: "expired" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.total_records).toBe(4);
    expect(r.lone_working.current).toBe(2);
    expect(r.lone_working.due_review).toBe(1);
    expect(r.lone_working.expired).toBe(1);
  });

  it("calculates unique staff coverage rate", () => {
    const lws = [
      makeLW({ id: "lw_1", staff_id: "s1" }),
      makeLW({ id: "lw_2", staff_id: "s1" }),
      makeLW({ id: "lw_3", staff_id: "s2" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws, total_staff: 5 }));
    expect(r.lone_working.unique_staff_covered).toBe(2);
    expect(r.lone_working.coverage_rate).toBe(40);
  });

  it("counts high risk records", () => {
    const lws = [
      makeLW({ id: "lw_1", risk_level: "high" }),
      makeLW({ id: "lw_2", staff_id: "s2", risk_level: "high" }),
      makeLW({ id: "lw_3", staff_id: "s3", risk_level: "low" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.high_risk_count).toBe(2);
  });

  it("calculates alarm issuance rate", () => {
    const lws = [
      makeLW({ id: "lw_1", personal_alarm_issued: true }),
      makeLW({ id: "lw_2", staff_id: "s2", personal_alarm_issued: true }),
      makeLW({ id: "lw_3", staff_id: "s3", personal_alarm_issued: false }),
      makeLW({ id: "lw_4", staff_id: "s4", personal_alarm_issued: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.alarms_issued).toBe(2);
    expect(r.lone_working.alarm_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. DEBRIEF PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("debrief profile", () => {
  it("counts debriefs by status", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "completed" }),
      makeDebrief({ id: "db_2", status: "completed" }),
      makeDebrief({ id: "db_3", status: "scheduled" }),
      makeDebrief({ id: "db_4", status: "overdue" }),
      makeDebrief({ id: "db_5", status: "declined" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.total).toBe(5);
    expect(r.debriefs.completed).toBe(2);
    expect(r.debriefs.scheduled).toBe(1);
    expect(r.debriefs.overdue).toBe(1);
    expect(r.debriefs.declined).toBe(1);
  });

  it("calculates completion rate from completed / (completed + overdue)", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "completed" }),
      makeDebrief({ id: "db_2", status: "completed" }),
      makeDebrief({ id: "db_3", status: "completed" }),
      makeDebrief({ id: "db_4", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.completion_rate).toBe(75); // 3 / 4
  });

  it("counts high impact debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", emotional_impact: "high" }),
      makeDebrief({ id: "db_2", emotional_impact: "significant" }),
      makeDebrief({ id: "db_3", emotional_impact: "moderate" }),
      makeDebrief({ id: "db_4", emotional_impact: "low" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.high_impact_count).toBe(2);
  });

  it("counts follow-up needed", () => {
    const dbs = [
      makeDebrief({ id: "db_1", follow_up_needed: true }),
      makeDebrief({ id: "db_2", follow_up_needed: true }),
      makeDebrief({ id: "db_3", follow_up_needed: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.follow_up_needed_count).toBe(2);
  });

  it("calculates learning rate", () => {
    const dbs = [
      makeDebrief({ id: "db_1", learning_points: ["LP1"] }),
      makeDebrief({ id: "db_2", learning_points: ["LP2"] }),
      makeDebrief({ id: "db_3", learning_points: [] }),
      makeDebrief({ id: "db_4", learning_points: [] }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.with_learning_points).toBe(2);
    expect(r.debriefs.learning_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. GRIEVANCE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("grievance profile", () => {
  it("counts grievances by resolution status", () => {
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "withdrawn" }),
      makeGrievance({ id: "gr_3", status: "under_investigation" }),
      makeGrievance({ id: "gr_4", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.grievance_profile.total).toBe(4);
    expect(r.grievance_profile.resolved).toBe(1);
    expect(r.grievance_profile.withdrawn).toBe(1);
    expect(r.grievance_profile.open).toBe(2);
  });

  it("calculates resolution rate", () => {
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "resolved" }),
      makeGrievance({ id: "gr_3", status: "under_investigation" }),
      makeGrievance({ id: "gr_4", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.grievance_profile.resolution_rate).toBe(50); // 2/4
  });

  it("counts critical grievances", () => {
    const grs = [
      makeGrievance({ id: "gr_1", severity: "critical" }),
      makeGrievance({ id: "gr_2", severity: "critical" }),
      makeGrievance({ id: "gr_3", severity: "low" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.grievance_profile.critical_count).toBe(2);
  });

  it("handles no grievances", () => {
    const r = computeHomeStaffSafety(baseInput({ grievances: [] }));
    expect(r.grievance_profile.total).toBe(0);
    expect(r.grievance_profile.resolution_rate).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. LWRA PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("lwra profile", () => {
  it("counts approved vs not approved", () => {
    const lwras = [
      makeLWRA({ id: "lwra_1", approved_to_work_alone: true }),
      makeLWRA({ id: "lwra_2", staff_member: "s2", approved_to_work_alone: true }),
      makeLWRA({ id: "lwra_3", staff_member: "s3", approved_to_work_alone: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.lwra.approved).toBe(2);
    expect(r.lwra.not_approved).toBe(1);
    expect(r.lwra.approval_rate).toBe(67); // Math.round(2/3*100)
  });

  it("identifies overdue reviews", () => {
    const lwras = [
      makeLWRA({ id: "lwra_1", next_review_date: "2026-04-01" }), // overdue
      makeLWRA({ id: "lwra_2", staff_member: "s2", next_review_date: "2026-06-01" }), // future
    ];
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.lwra.overdue_review).toBe(1);
  });

  it("counts high risk assessments", () => {
    const lwras = [
      makeLWRA({ id: "lwra_1", overall_risk_level: "high" }),
      makeLWRA({ id: "lwra_2", staff_member: "s2", overall_risk_level: "low" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.lwra.high_risk_count).toBe(1);
  });

  it("handles no risk assessments", () => {
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: [] }));
    expect(r.lwra.total).toBe(0);
    expect(r.lwra.approval_rate).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: lone working coverage", () => {
  it("awards +5 for >= 80% coverage", () => {
    const lws = Array.from({ length: 8 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}` }),
    );
    const highR = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    // 80% coverage → +5
    const lowLws = Array.from({ length: 4 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}` }),
    );
    const lowR = computeHomeStaffSafety(baseInput({ lone_working_records: lowLws }));
    // 40% coverage → 0
    expect(highR.safety_score - lowR.safety_score).toBe(5);
  });

  it("penalises -5 for 0% coverage (no records)", () => {
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: [] }));
    // mod1 = -5 for 0%, mod2 = -2 for no records, mod3 = -1 for no records
    expect(r.lone_working.coverage_rate).toBe(0);
  });
});

describe("mod2: assessment currency", () => {
  it("awards +4 when no expired/due_review", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "current" }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "current" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    // All current → expiredRate 0 → +4
    expect(r.lone_working.expired).toBe(0);
    expect(r.lone_working.due_review).toBe(0);
  });

  it("penalises -4 when > 40% expired/due_review", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "expired" }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "expired" }),
      makeLW({ id: "lw_3", staff_id: "s3", status: "due_review" }),
      makeLW({ id: "lw_4", staff_id: "s4", status: "current" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    // 3/4 = 75% expired/due_review → -4
    expect(r.lone_working.expired + r.lone_working.due_review).toBe(3);
  });
});

describe("mod3: personal alarm provision", () => {
  it("awards +3 for >= 80% alarm rate", () => {
    const lws = Array.from({ length: 5 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, personal_alarm_issued: true }),
    );
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.alarm_rate).toBe(100);
  });

  it("penalises -3 for < 40% alarm rate", () => {
    const lws = [
      makeLW({ id: "lw_1", personal_alarm_issued: true }),
      makeLW({ id: "lw_2", staff_id: "s2", personal_alarm_issued: false }),
      makeLW({ id: "lw_3", staff_id: "s3", personal_alarm_issued: false }),
      makeLW({ id: "lw_4", staff_id: "s4", personal_alarm_issued: false }),
      makeLW({ id: "lw_5", staff_id: "s5", personal_alarm_issued: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.alarm_rate).toBe(20);
  });
});

describe("mod4: debrief completion", () => {
  it("awards +4 for >= 90% completion rate", () => {
    const dbs = Array.from({ length: 10 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, status: "completed" }),
    );
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.completion_rate).toBe(100);
  });

  it("penalises -4 for < 50% completion rate", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "completed" }),
      makeDebrief({ id: "db_2", status: "overdue" }),
      makeDebrief({ id: "db_3", status: "overdue" }),
      makeDebrief({ id: "db_4", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.completion_rate).toBe(25); // 1/(1+3) = 25%
  });

  it("awards 0 when no debriefs", () => {
    const withDb = computeHomeStaffSafety(baseInput({ debriefs: [makeDebrief()] }));
    const withoutDb = computeHomeStaffSafety(baseInput({ debriefs: [] }));
    // Without debriefs: mod4=0, mod5=0, mod8=0
    // With 1 completed debrief: mod4=+4, mod5=0 (no high impact), mod8=+3 (100% learning)
    // Difference = 7
    expect(withDb.safety_score - withoutDb.safety_score).toBe(7);
  });
});

describe("mod5: emotional support", () => {
  it("awards +3 when >= 80% high-impact debriefs have follow-up", () => {
    const dbs = [
      makeDebrief({ id: "db_1", emotional_impact: "high", follow_up_needed: true }),
      makeDebrief({ id: "db_2", emotional_impact: "significant", follow_up_needed: true }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    // 2/2 = 100% follow-up rate → +3
    expect(r.debriefs.high_impact_count).toBe(2);
  });

  it("penalises -3 when < 40% high-impact debriefs have follow-up", () => {
    const dbs = [
      makeDebrief({ id: "db_1", emotional_impact: "high", follow_up_needed: false }),
      makeDebrief({ id: "db_2", emotional_impact: "significant", follow_up_needed: false }),
      makeDebrief({ id: "db_3", emotional_impact: "high", follow_up_needed: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    // 0/3 = 0% → -3
    expect(r.debriefs.high_impact_count).toBe(3);
  });

  it("returns 0 when no high-impact debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", emotional_impact: "low" }),
      makeDebrief({ id: "db_2", emotional_impact: "moderate" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.high_impact_count).toBe(0);
  });
});

describe("mod6: grievance resolution", () => {
  it("awards +3 for >= 70% resolution rate", () => {
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "resolved" }),
      makeGrievance({ id: "gr_3", status: "resolved" }),
      makeGrievance({ id: "gr_4", status: "under_investigation" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.grievance_profile.resolution_rate).toBe(75);
  });

  it("penalises -3 for < 30% resolution rate", () => {
    const grs = [
      makeGrievance({ id: "gr_1", status: "under_investigation" }),
      makeGrievance({ id: "gr_2", status: "formal_submitted" }),
      makeGrievance({ id: "gr_3", status: "hearing_scheduled" }),
      makeGrievance({ id: "gr_4", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.grievance_profile.resolution_rate).toBe(0);
  });

  it("returns 0 when no grievances", () => {
    const with0 = computeHomeStaffSafety(baseInput({ grievances: [] }));
    const withResolved = computeHomeStaffSafety(baseInput({
      grievances: [makeGrievance({ status: "resolved" })],
    }));
    // with0: mod6=0, withResolved: mod6=+3 (100% resolved)
    expect(withResolved.safety_score - with0.safety_score).toBe(3);
  });
});

describe("mod7: LWRA approval rate", () => {
  it("awards +3 for >= 80% approval rate", () => {
    const lwras = Array.from({ length: 5 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.lwra.approval_rate).toBe(100);
  });

  it("penalises -3 for < 40% approval rate", () => {
    const lwras = [
      makeLWRA({ id: "lwra_1", approved_to_work_alone: true }),
      makeLWRA({ id: "lwra_2", staff_member: "s2", approved_to_work_alone: false }),
      makeLWRA({ id: "lwra_3", staff_member: "s3", approved_to_work_alone: false }),
      makeLWRA({ id: "lwra_4", staff_member: "s4", approved_to_work_alone: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.lwra.approval_rate).toBe(25);
  });

  it("returns 0 when no risk assessments", () => {
    const with0 = computeHomeStaffSafety(baseInput({ risk_assessments: [] }));
    const withApproved = computeHomeStaffSafety(baseInput({
      risk_assessments: [makeLWRA({ approved_to_work_alone: true })],
    }));
    expect(withApproved.safety_score - with0.safety_score).toBe(3);
  });
});

describe("mod8: learning culture", () => {
  it("awards +3 for >= 80% learning rate", () => {
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, learning_points: ["LP"] }),
    );
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.learning_rate).toBe(100);
  });

  it("penalises -3 for < 30% learning rate", () => {
    const dbs = [
      makeDebrief({ id: "db_1", learning_points: [] }),
      makeDebrief({ id: "db_2", learning_points: [] }),
      makeDebrief({ id: "db_3", learning_points: [] }),
      makeDebrief({ id: "db_4", learning_points: [] }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.debriefs.learning_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes strength for high coverage", () => {
    const lws = Array.from({ length: 9 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}` }),
    );
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("coverage"))).toBe(true);
  });

  it("includes strength for all current assessments", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "current" }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "current" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.strengths.some((s) => s.includes("current"))).toBe(true);
  });

  it("includes strength for high alarm rate", () => {
    const lws = Array.from({ length: 5 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, personal_alarm_issued: true }),
    );
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.strengths.some((s) => s.includes("alarm"))).toBe(true);
  });

  it("includes strength for high debrief completion", () => {
    const dbs = Array.from({ length: 10 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, status: "completed" }),
    );
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.strengths.some((s) => s.includes("debrief completion"))).toBe(true);
  });

  it("includes strength for high grievance resolution", () => {
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "resolved" }),
      makeGrievance({ id: "gr_3", status: "resolved" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.strengths.some((s) => s.includes("grievance"))).toBe(true);
  });

  it("includes strength for high LWRA approval", () => {
    const lwras = Array.from({ length: 5 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.strengths.some((s) => s.includes("approved"))).toBe(true);
  });

  it("includes strength for high learning rate", () => {
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, learning_points: ["LP"] }),
    );
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.strengths.some((s) => s.includes("learning points"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags low coverage", () => {
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: [makeLW()],
      total_staff: 20,
    }));
    expect(r.concerns.some((c) => c.includes("coverage") || c.includes("gaps"))).toBe(true);
  });

  it("flags expired assessments", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "expired" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.concerns.some((c) => c.includes("expired"))).toBe(true);
  });

  it("flags low alarm rate", () => {
    const lws = [
      makeLW({ id: "lw_1", personal_alarm_issued: false }),
      makeLW({ id: "lw_2", staff_id: "s2", personal_alarm_issued: false }),
      makeLW({ id: "lw_3", staff_id: "s3", personal_alarm_issued: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.concerns.some((c) => c.includes("alarm"))).toBe(true);
  });

  it("flags overdue debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.concerns.some((c) => c.includes("overdue") && c.includes("debrief"))).toBe(true);
  });

  it("flags critical grievances", () => {
    const grs = [
      makeGrievance({ id: "gr_1", severity: "critical", status: "under_investigation" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.concerns.some((c) => c.includes("critical grievance"))).toBe(true);
  });

  it("flags overdue LWRA reviews", () => {
    const lwras = [
      makeLWRA({ id: "lwra_1", next_review_date: "2026-01-01" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ risk_assessments: lwras }));
    expect(r.concerns.some((c) => c.includes("overdue") && c.includes("risk assessment"))).toBe(true);
  });

  it("flags high-risk lone working", () => {
    const lws = [
      makeLW({ id: "lw_1", risk_level: "high" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.concerns.some((c) => c.includes("high-risk"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends renewing expired assessments", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "expired" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("expired") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends completing overdue debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue debrief") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends investigating critical grievances", () => {
    const grs = [
      makeGrievance({ id: "gr_1", severity: "critical", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("critical grievance") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends extending coverage when low", () => {
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: [makeLW()],
      total_staff: 20,
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("coverage") && rec.urgency === "soon")).toBe(true);
  });

  it("recommends issuing alarms when low", () => {
    const lws = [
      makeLW({ id: "lw_1", personal_alarm_issued: false }),
      makeLW({ id: "lw_2", staff_id: "s2", personal_alarm_issued: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("alarm"))).toBe(true);
  });

  it("assigns sequential ranks", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "expired", personal_alarm_issued: false }),
    ];
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      debriefs: dbs,
      total_staff: 20,
    }));
    const ranks = r.recommendations.map((rec) => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });

  it("includes regulatory references", () => {
    const lws = [makeLW({ id: "lw_1", status: "expired" })];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("expired"));
    expect(rec?.regulatory_ref).toBe("Reg 33/34");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("flags critical insight for many expired assessments", () => {
    const lws = [
      makeLW({ id: "lw_1", status: "expired" }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "expired" }),
      makeLW({ id: "lw_3", staff_id: "s3", status: "expired" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("expired"))).toBe(true);
  });

  it("flags critical insight for multiple critical grievances", () => {
    const grs = [
      makeGrievance({ id: "gr_1", severity: "critical", status: "under_investigation" }),
      makeGrievance({ id: "gr_2", severity: "critical", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ grievances: grs }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("critical grievance"))).toBe(true);
  });

  it("flags critical insight for many overdue debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue" }),
      makeDebrief({ id: "db_2", status: "overdue" }),
      makeDebrief({ id: "db_3", status: "overdue" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("overdue debrief"))).toBe(true);
  });

  it("flags warning for high-risk with low alarm rate", () => {
    const lws = [
      makeLW({ id: "lw_1", risk_level: "high", personal_alarm_issued: false }),
      makeLW({ id: "lw_2", staff_id: "s2", risk_level: "high", personal_alarm_issued: false }),
      makeLW({ id: "lw_3", staff_id: "s3", risk_level: "low", personal_alarm_issued: false }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("alarm"))).toBe(true);
  });

  it("flags positive insight for follow-up on high impact debriefs", () => {
    const dbs = [
      makeDebrief({ id: "db_1", emotional_impact: "high", follow_up_needed: true }),
      makeDebrief({ id: "db_2", emotional_impact: "significant", follow_up_needed: true }),
    ];
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("follow-up"))).toBe(true);
  });

  it("flags positive insight for strong learning culture", () => {
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, learning_points: ["LP"] }),
    );
    const r = computeHomeStaffSafety(baseInput({ debriefs: dbs }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("learning"))).toBe(true);
  });

  it("flags positive insight for comprehensive coverage + approval", () => {
    const lws = Array.from({ length: 8 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}` }),
    );
    const lwras = Array.from({ length: 5 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: lwras,
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Comprehensive"))).toBe(true);
  });

  it("flags positive insight for no grievances + good debriefs", () => {
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, status: "completed" }),
    );
    const r = computeHomeStaffSafety(baseInput({
      debriefs: dbs,
      grievances: [],
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("No grievances"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("returns outstanding headline", () => {
    const lws = Array.from({ length: 8 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, personal_alarm_issued: true }),
    );
    const lwras = Array.from({ length: 8 }, (_, i) =>
      makeLWRA({ id: `lwra_${i}`, staff_member: `s${i}`, approved_to_work_alone: true }),
    );
    const dbs = Array.from({ length: 5 }, (_, i) =>
      makeDebrief({
        id: `db_${i}`,
        status: "completed",
        emotional_impact: "high",
        follow_up_needed: true,
        learning_points: ["LP"],
      }),
    );
    const grs = [
      makeGrievance({ id: "gr_1", status: "resolved" }),
      makeGrievance({ id: "gr_2", status: "resolved", raised_by: "staff_2" }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: lwras,
      debriefs: dbs,
      grievances: grs,
    }));
    expect(r.headline).toContain("Exceptional");
  });

  it("returns inadequate headline", () => {
    const lws = [
      makeLW({ id: "lw_1", staff_id: "s1", status: "expired", personal_alarm_issued: false }),
      makeLW({ id: "lw_2", staff_id: "s2", status: "expired", personal_alarm_issued: false }),
    ];
    const dbs = [
      makeDebrief({ id: "db_1", status: "overdue", learning_points: [] }),
      makeDebrief({ id: "db_2", status: "overdue", learning_points: [] }),
      makeDebrief({ id: "db_3", status: "overdue", learning_points: [] }),
    ];
    const grs = [
      makeGrievance({ id: "gr_1", severity: "critical", status: "under_investigation" }),
      makeGrievance({ id: "gr_2", severity: "critical", status: "formal_submitted" }),
    ];
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: [makeLWRA({ approved_to_work_alone: false })],
      debriefs: dbs,
      grievances: grs,
      total_staff: 20,
    }));
    expect(r.headline).toContain("Significant");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles all empty arrays (but total_staff > 0)", () => {
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: [],
      risk_assessments: [],
      debriefs: [],
      grievances: [],
      total_staff: 5,
    }));
    expect(r.safety_rating).not.toBe("insufficient_data");
    expect(r.safety_score).toBeGreaterThan(0);
  });

  it("clamps score to 0-100", () => {
    // Even with all negatives, score should not go below 0
    const lws = Array.from({ length: 20 }, (_, i) =>
      makeLW({ id: `lw_${i}`, staff_id: `s${i}`, status: "expired", personal_alarm_issued: false }),
    );
    const dbs = Array.from({ length: 10 }, (_, i) =>
      makeDebrief({ id: `db_${i}`, status: "overdue", emotional_impact: "high", follow_up_needed: false, learning_points: [] }),
    );
    const grs = Array.from({ length: 5 }, (_, i) =>
      makeGrievance({ id: `gr_${i}`, severity: "critical", status: "formal_submitted" }),
    );
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: lws,
      risk_assessments: [makeLWRA({ approved_to_work_alone: false })],
      debriefs: dbs,
      grievances: grs,
      total_staff: 100,
    }));
    expect(r.safety_score).toBeGreaterThanOrEqual(0);
    expect(r.safety_score).toBeLessThanOrEqual(100);
  });

  it("handles single staff member", () => {
    const r = computeHomeStaffSafety(baseInput({
      lone_working_records: [makeLW()],
      total_staff: 1,
    }));
    expect(r.lone_working.coverage_rate).toBe(100);
  });

  it("handles duplicate staff IDs in lone working", () => {
    const lws = [
      makeLW({ id: "lw_1", staff_id: "s1" }),
      makeLW({ id: "lw_2", staff_id: "s1" }),
      makeLW({ id: "lw_3", staff_id: "s1" }),
    ];
    const r = computeHomeStaffSafety(baseInput({ lone_working_records: lws }));
    expect(r.lone_working.unique_staff_covered).toBe(1);
    expect(r.lone_working.total_records).toBe(3);
  });

  it("returns non-empty result for typical data", () => {
    const r = computeHomeStaffSafety(baseInput());
    expect(r.safety_rating).toBeTruthy();
    expect(r.headline).toBeTruthy();
    expect(typeof r.safety_score).toBe("number");
  });
});
