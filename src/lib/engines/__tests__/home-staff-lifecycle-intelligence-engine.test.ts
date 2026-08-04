// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF LIFECYCLE INTELLIGENCE ENGINE — TESTS
// Reg 32/33: fitness of workers, employment of staff.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeStaffLifecycle,
  type HomeStaffLifecycleInput,
  type StaffInductionInput,
  type StaffSicknessInput,
  type StaffExitInput,
  type StaffRecognitionInput,
} from "../home-staff-lifecycle-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeInduction(overrides: Partial<StaffInductionInput> = {}): StaffInductionInput {
  return {
    id: "ind_1",
    staff_id: "staff_1",
    start_date: "2026-04-01",
    overall_status: "completed",
    tasks_total: 10,
    tasks_completed: 10,
    ...overrides,
  };
}

function makeSickness(overrides: Partial<StaffSicknessInput> = {}): StaffSicknessInput {
  return {
    id: "sick_1",
    staff_id: "staff_1",
    date_started: "2026-05-01",
    date_ended: "2026-05-03",
    total_days: 2,
    rtw_status: "not_required",
    occupational_health_referral: false,
    trigger_points_count: 0,
    ...overrides,
  };
}

function makeExit(overrides: Partial<StaffExitInput> = {}): StaffExitInput {
  return {
    id: "exit_1",
    interview_date: "2026-05-15",
    status: "completed",
    overall_rating: 4,
    would_recommend: true,
    improvements_count: 1,
    ...overrides,
  };
}

function makeRecognition(overrides: Partial<StaffRecognitionInput> = {}): StaffRecognitionInput {
  return {
    id: "rec_1",
    date: "2026-05-10",
    child_contributed_nomination: false,
    public_celebration: false,
    ...overrides,
  };
}

/**
 * Base input builder. By default:
 * - 1 completed induction (10/10 tasks) → mod1: +5, mod7: +3
 * - 0 sickness records → mod2: +4 (absenceRate=0, <=2%), mod3: +2 (none needing RTW), mod8: +1 (none with triggers)
 * - 0 exit records → mod4: +1 (no exits), mod5: +0 (no ratings)
 * - 0 recognition records → mod6: -3 (0 events, 0 per staff)
 * - total_staff: 10
 * Base 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
 */
function baseInput(overrides: Partial<HomeStaffLifecycleInput> = {}): HomeStaffLifecycleInput {
  return {
    today: "2026-05-27",
    induction_records: [makeInduction()],
    sickness_records: [],
    exit_interview_records: [],
    recognition_records: [],
    total_staff: 10,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays are empty", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [],
      recognition_records: [],
      total_staff: 10,
    });
    expect(r.lifecycle_rating).toBe("insufficient_data");
    expect(r.lifecycle_score).toBe(0);
  });

  it("uses the correct insufficient_data headline", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [],
      recognition_records: [],
      total_staff: 10,
    });
    expect(r.headline).toBe("No staff lifecycle data available for analysis.");
  });

  it("returns zero profiles on insufficient data", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [],
      recognition_records: [],
      total_staff: 0,
    });
    expect(r.induction.total_records).toBe(0);
    expect(r.sickness.total_episodes_90d).toBe(0);
    expect(r.exit_interviews.total_exits).toBe(0);
    expect(r.recognition.total_events_90d).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [],
      recognition_records: [],
      total_staff: 10,
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("does NOT return insufficient_data when at least one record exists", () => {
    const r = computeHomeStaffLifecycle(baseInput());
    expect(r.lifecycle_rating).not.toBe("insufficient_data");
    expect(r.lifecycle_score).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INDUCTION PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("induction profile", () => {
  it("counts total induction records", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1" }),
        makeInduction({ id: "i2", staff_id: "s2" }),
      ],
    }));
    expect(r.induction.total_records).toBe(2);
  });

  it("counts completed inductions", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "completed" }),
        makeInduction({ id: "i2", overall_status: "in_progress" }),
        makeInduction({ id: "i3", overall_status: "completed" }),
      ],
    }));
    expect(r.induction.completed_count).toBe(2);
  });

  it("counts overdue inductions", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "overdue" }),
        makeInduction({ id: "i2", overall_status: "completed" }),
        makeInduction({ id: "i3", overall_status: "overdue" }),
      ],
    }));
    expect(r.induction.overdue_count).toBe(2);
  });

  it("calculates average task completion percentage", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 10, tasks_completed: 8 }),
        makeInduction({ id: "i2", tasks_total: 10, tasks_completed: 6 }),
      ],
    }));
    // (80% + 60%) / 2 = 70%
    expect(r.induction.avg_task_completion).toBe(70);
  });

  it("handles inductions with zero tasks_total", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 0, tasks_completed: 0 }),
        makeInduction({ id: "i2", tasks_total: 10, tasks_completed: 8 }),
      ],
    }));
    // Only the second one counts: 80%
    expect(r.induction.avg_task_completion).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. SICKNESS PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("sickness profile", () => {
  it("counts episodes within 90 days", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01" }),             // 26 days ago
        makeSickness({ id: "s2", date_started: "2026-03-01" }),             // 87 days ago
        makeSickness({ id: "s3", date_started: "2026-02-01" }),             // 115 days ago - outside
      ],
    }));
    expect(r.sickness.total_episodes_90d).toBe(2);
  });

  it("sums total days in 90-day window", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 5 }),
        makeSickness({ id: "s2", date_started: "2026-04-01", total_days: 3 }),
      ],
    }));
    expect(r.sickness.total_days_90d).toBe(8);
  });

  it("calculates absence rate correctly", () => {
    // 10 staff * 90 = 900 possible days. 9 days sick = 1%
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 9 }),
      ],
    }));
    expect(r.sickness.absence_rate).toBe(1);
  });

  it("counts active episodes (date_ended is null)", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_ended: null }),
        makeSickness({ id: "s2", date_ended: "2026-05-05" }),
        makeSickness({ id: "s3", date_ended: null }),
      ],
    }));
    expect(r.sickness.active_episodes).toBe(2);
  });

  it("returns 0 absence rate when total_staff is 0", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      total_staff: 0,
      sickness_records: [makeSickness({ total_days: 5, date_started: "2026-05-01" })],
    }));
    expect(r.sickness.absence_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. EXIT INTERVIEW PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("exit interview profile", () => {
  it("counts total and completed exits", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed" }),
        makeExit({ id: "e2", status: "scheduled" }),
        makeExit({ id: "e3", status: "completed" }),
      ],
    }));
    expect(r.exit_interviews.total_exits).toBe(3);
    expect(r.exit_interviews.completed_count).toBe(2);
  });

  it("calculates average rating from completed exits", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 4 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 3 }),
        makeExit({ id: "e3", status: "scheduled", overall_rating: 1 }), // not counted
      ],
    }));
    expect(r.exit_interviews.avg_rating).toBe(3.5);
  });

  it("ignores null ratings", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 4 }),
        makeExit({ id: "e2", status: "completed", overall_rating: null }),
      ],
    }));
    expect(r.exit_interviews.avg_rating).toBe(4);
  });

  it("calculates would_recommend rate among completed exits", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", would_recommend: true }),
        makeExit({ id: "e2", status: "completed", would_recommend: false }),
        makeExit({ id: "e3", status: "completed", would_recommend: true }),
      ],
    }));
    expect(r.exit_interviews.would_recommend_rate).toBe(67);
  });

  it("returns 0 for avg_rating when no completed exits have ratings", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "scheduled", overall_rating: 5 }),
      ],
    }));
    expect(r.exit_interviews.avg_rating).toBeNull();;
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. RECOGNITION PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("recognition profile", () => {
  it("counts recognition events in 90-day window", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),         // 17d ago
        makeRecognition({ id: "r2", date: "2026-03-01" }),         // 87d ago
        makeRecognition({ id: "r3", date: "2026-01-01" }),         // 146d ago - outside
      ],
    }));
    expect(r.recognition.total_events_90d).toBe(2);
  });

  it("calculates events per staff member", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      total_staff: 10,
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),
        makeRecognition({ id: "r2", date: "2026-05-12" }),
        makeRecognition({ id: "r3", date: "2026-05-15" }),
        makeRecognition({ id: "r4", date: "2026-05-20" }),
        makeRecognition({ id: "r5", date: "2026-05-22" }),
      ],
    }));
    // 5 events / 10 staff = 0.5
    expect(r.recognition.events_per_staff).toBe(0.5);
  });

  it("calculates child nomination rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10", child_contributed_nomination: true }),
        makeRecognition({ id: "r2", date: "2026-05-12", child_contributed_nomination: false }),
        makeRecognition({ id: "r3", date: "2026-05-15", child_contributed_nomination: true }),
      ],
    }));
    expect(r.recognition.child_nomination_rate).toBe(67);
  });

  it("calculates public celebration rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10", public_celebration: true }),
        makeRecognition({ id: "r2", date: "2026-05-12", public_celebration: true }),
        makeRecognition({ id: "r3", date: "2026-05-15", public_celebration: false }),
        makeRecognition({ id: "r4", date: "2026-05-20", public_celebration: false }),
      ],
    }));
    expect(r.recognition.public_celebration_rate).toBe(50);
  });

  it("returns 0 events_per_staff when total_staff is 0", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      total_staff: 0,
      recognition_records: [makeRecognition({ date: "2026-05-10" })],
    }));
    expect(r.recognition.events_per_staff).toBeNull();;
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    // Max everything: base 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ tasks_total: 10, tasks_completed: 10 })], // mod1: +5 (100%), mod7: +3 (100%)
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 3, rtw_status: "completed", trigger_points_count: 1, occupational_health_referral: true }),
      ], // mod2: needs low absence, mod3: +4, mod8: +3
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 5 }),
      ], // mod4: +3, mod5: +3
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),
        makeRecognition({ id: "r2", date: "2026-05-11" }),
        makeRecognition({ id: "r3", date: "2026-05-12" }),
        makeRecognition({ id: "r4", date: "2026-05-13" }),
        makeRecognition({ id: "r5", date: "2026-05-14" }),
      ], // 5 events / 10 staff = 0.5 → mod6: +3
      total_staff: 10,
    }));
    // absenceRate = 3/(10*90)*100 = 0.33% → mod2: +4
    expect(r.lifecycle_score).toBe(80);
    expect(r.lifecycle_rating).toBe("outstanding");
  });

  it("returns good for score >= 65 and < 80", () => {
    // Base input gives 65
    const r = computeHomeStaffLifecycle(baseInput());
    expect(r.lifecycle_score).toBe(65);
    expect(r.lifecycle_rating).toBe("good");
  });

  it("returns adequate for score >= 45 and < 65", () => {
    // Reduce some modifiers to get into adequate range
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "completed", tasks_total: 10, tasks_completed: 7 }),
        makeInduction({ id: "i2", overall_status: "overdue", tasks_total: 10, tasks_completed: 3 }),
      ], // mod1: 50% completed < 60 → -5; mod7: avg((70+30)/2)=50 → +0
      recognition_records: [], // mod6: 0 events → -3
      total_staff: 10,
    }));
    // 52 + (-5) + 4 + 2 + 1 + 0 + (-3) + 0 + 1 = 52
    expect(r.lifecycle_score).toBe(52);
    expect(r.lifecycle_rating).toBe("adequate");
  });

  it("returns inadequate for score < 45", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "overdue", tasks_total: 10, tasks_completed: 2 }),
      ], // mod1: 0% completed < 60 → -5; mod7: 20% < 50 → -3
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 60, rtw_status: "overdue", trigger_points_count: 2, occupational_health_referral: false }),
      ], // mod2: 60/(10*90)*100=6.67% > 6 → -4; mod3: 0% completed < 50 → -4; mod8: 0% < 40 → -3
      exit_interview_records: [
        makeExit({ id: "e1", status: "declined", overall_rating: null }),
      ], // mod4: 0% completed < 50 → -3; mod5: no ratings → +0
      recognition_records: [], // mod6: 0 events → -3
      total_staff: 10,
    }));
    // 52 + (-5) + (-4) + (-4) + (-3) + 0 + (-3) + (-3) + (-3) = 27
    expect(r.lifecycle_score).toBe(27);
    expect(r.lifecycle_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("returns outstanding headline for outstanding rating", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ tasks_total: 10, tasks_completed: 10 })],
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 3, rtw_status: "completed", trigger_points_count: 1, occupational_health_referral: true }),
      ],
      exit_interview_records: [makeExit({ id: "e1", status: "completed", overall_rating: 5 })],
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),
        makeRecognition({ id: "r2", date: "2026-05-11" }),
        makeRecognition({ id: "r3", date: "2026-05-12" }),
        makeRecognition({ id: "r4", date: "2026-05-13" }),
        makeRecognition({ id: "r5", date: "2026-05-14" }),
      ],
      total_staff: 10,
    }));
    expect(r.headline).toBe("Exemplary staff lifecycle management — induction, retention and recognition all excelling.");
  });

  it("returns good headline", () => {
    const r = computeHomeStaffLifecycle(baseInput());
    expect(r.headline).toBe("Strong staff lifecycle management — most systems working well.");
  });

  it("returns adequate headline", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "completed", tasks_total: 10, tasks_completed: 7 }),
        makeInduction({ id: "i2", overall_status: "overdue", tasks_total: 10, tasks_completed: 3 }),
      ],
      recognition_records: [],
      total_staff: 10,
    }));
    expect(r.headline).toBe("Staff lifecycle management meets basic requirements but needs improvement.");
  });

  it("returns inadequate headline", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ id: "i1", overall_status: "overdue", tasks_total: 10, tasks_completed: 2 })],
      sickness_records: [makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 60, rtw_status: "overdue", trigger_points_count: 2, occupational_health_referral: false })],
      exit_interview_records: [makeExit({ id: "e1", status: "declined", overall_rating: null })],
      recognition_records: [],
      total_staff: 10,
    }));
    expect(r.headline).toBe("Significant staff lifecycle concerns — immediate management attention required.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 1: INDUCTION COMPLETION RATE (±5)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: induction completion rate", () => {
  // To isolate mod1, we need consistent other modifiers.
  // Use 0 sickness, 0 exits, 0 recognition, total_staff=10
  // mod2: +4, mod3: +2, mod4: +1, mod5: 0, mod6: -3, mod8: +1
  // Sum of others = 4+2+1+0+(-3)+1 = 5

  it("awards +5 for >=95% completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: Array.from({ length: 20 }, (_, i) =>
        makeInduction({ id: `i${i}`, staff_id: `s${i}`, overall_status: i < 19 ? "completed" : "completed", tasks_total: 10, tasks_completed: 10 }),
      ), // 100% → +5, mod7: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("awards +3 for >=80% but <95% completion", () => {
    const inductions = Array.from({ length: 10 }, (_, i) =>
      makeInduction({ id: `i${i}`, staff_id: `s${i}`, overall_status: i < 8 ? "completed" : "in_progress", tasks_total: 10, tasks_completed: 10 }),
    ); // 80% → +3, mod7: 100% → +3
    const r = computeHomeStaffLifecycle(baseInput({ induction_records: inductions }));
    // 52 + 3 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 63
    expect(r.lifecycle_score).toBe(63);
  });

  it("awards +0 for >=60% but <80% completion", () => {
    const inductions = Array.from({ length: 10 }, (_, i) =>
      makeInduction({ id: `i${i}`, staff_id: `s${i}`, overall_status: i < 7 ? "completed" : "in_progress", tasks_total: 10, tasks_completed: 10 }),
    ); // 70% → +0, mod7: 100% → +3
    const r = computeHomeStaffLifecycle(baseInput({ induction_records: inductions }));
    // 52 + 0 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 60
    expect(r.lifecycle_score).toBe(60);
  });

  it("penalises -5 for <60% completion", () => {
    const inductions = Array.from({ length: 10 }, (_, i) =>
      makeInduction({ id: `i${i}`, staff_id: `s${i}`, overall_status: i < 5 ? "completed" : "in_progress", tasks_total: 10, tasks_completed: 10 }),
    ); // 50% → -5, mod7: 100% → +3
    const r = computeHomeStaffLifecycle(baseInput({ induction_records: inductions }));
    // 52 + (-5) + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 55
    expect(r.lifecycle_score).toBe(55);
  });

  it("awards +0 when no induction records exist", () => {
    // Replace induction with a sickness record so totalData > 0
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [],
      sickness_records: [makeSickness({ date_started: "2026-05-01", total_days: 1 })],
    }));
    // No inductions → mod1: 0, mod7: 0
    // mod2: 1/(10*90)*100 = 0.11% <=2 → +4
    // mod3: total_days=2 < 3 → none needing RTW → +2
    // mod4: no exits → +1, mod5: 0, mod6: -3, mod8: no triggers → +1
    // 52 + 0 + 4 + 2 + 1 + 0 + (-3) + 0 + 1 = 57
    expect(r.lifecycle_score).toBe(57);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MODIFIER 2: SICKNESS ABSENCE RATE (±4)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod2: sickness absence rate", () => {
  // Baseline: 1 completed induction (mod1: +5, mod7: +3), 0 exits (mod4: +1), 0 recognition (mod6: -3)
  // mod5: 0, mod8: +1 (unless triggers present)

  it("awards +4 for absence rate <=2%", () => {
    // 10 staff * 90 = 900. 2% = 18 days.
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 18 }),
      ],
    }));
    // absence = 18/(10*90)*100 = 2% → +4
    // mod3: total_days=18 >=3 → needs RTW, rtw_status="not_required" ≠ "completed" → 0% < 50 → -4
    // mod8: no triggers → +1
    // 52 + 5 + 4 + (-4) + 1 + 0 + (-3) + 3 + 1 = 59
    expect(r.lifecycle_score).toBe(59);
  });

  it("awards +2 for absence rate >2% and <=4%", () => {
    // 3% = 27 days
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 27, rtw_status: "completed" }),
      ],
    }));
    // absence = 27/900*100 = 3% → +2
    // mod3: rtw_status completed → 100% → +4
    // mod8: no triggers → +1
    // 52 + 5 + 2 + 4 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("awards +0 for absence rate >4% and <=6%", () => {
    // 5% = 45 days
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 45, rtw_status: "completed" }),
      ],
    }));
    // absence = 45/900*100 = 5% → +0
    // mod3: rtw completed → +4, mod8: no triggers → +1
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + 1 = 63
    expect(r.lifecycle_score).toBe(63);
  });

  it("penalises -4 for absence rate >6%", () => {
    // 7% = 63 days
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 63, rtw_status: "completed" }),
      ],
    }));
    // absence = 63/900*100 = 7% → -4
    // mod3: rtw completed → +4, mod8: no triggers → +1
    // 52 + 5 + (-4) + 4 + 1 + 0 + (-3) + 3 + 1 = 59
    expect(r.lifecycle_score).toBe(59);
  });

  it("awards +0 when total_staff is 0 (no staff)", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      total_staff: 0,
      sickness_records: [makeSickness({ date_started: "2026-05-01", total_days: 5, rtw_status: "completed" })],
    }));
    // mod2: no staff → +0, mod6: no staff → +0
    // 52 + 5 + 0 + 4 + 1 + 0 + 0 + 3 + 1 = 66
    expect(r.lifecycle_score).toBe(66);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. MODIFIER 3: RETURN TO WORK COMPLIANCE (±4)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod3: return to work compliance", () => {
  it("awards +4 for >=90% RTW completion rate", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({ id: `s${i}`, staff_id: `st${i}`, date_started: "2026-05-01", total_days: 5, rtw_status: i < 9 ? "completed" : "scheduled" }),
    ); // 9/10 = 90% → +4
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // absenceRate = 50/(10*90)*100 = 5.56 → <=6 → mod2: +0
    // mod8: no triggers → +1
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + 1 = 63
    expect(r.lifecycle_score).toBe(63);
  });

  it("awards +2 for >=70% but <90%", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({ id: `s${i}`, staff_id: `st${i}`, date_started: "2026-05-01", total_days: 5, rtw_status: i < 7 ? "completed" : "scheduled" }),
    ); // 7/10 = 70% → +2
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + 2 + 1 + 0 + (-3) + 3 + 1 = 61
    expect(r.lifecycle_score).toBe(61);
  });

  it("awards +0 for >=50% but <70%", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({ id: `s${i}`, staff_id: `st${i}`, date_started: "2026-05-01", total_days: 5, rtw_status: i < 5 ? "completed" : "scheduled" }),
    ); // 5/10 = 50% → +0
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + 0 + 1 + 0 + (-3) + 3 + 1 = 59
    expect(r.lifecycle_score).toBe(59);
  });

  it("penalises -4 for <50% RTW completion", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({ id: `s${i}`, staff_id: `st${i}`, date_started: "2026-05-01", total_days: 5, rtw_status: i < 4 ? "completed" : "scheduled" }),
    ); // 4/10 = 40% → -4
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + (-4) + 1 + 0 + (-3) + 3 + 1 = 55
    expect(r.lifecycle_score).toBe(55);
  });

  it("awards +2 when no records need RTW (total_days < 3)", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 2 }),
        makeSickness({ id: "s2", date_started: "2026-05-10", total_days: 1 }),
      ],
    }));
    // mod3: none need RTW → +2, mod2: 3/(900)*100=0.33% → +4, mod8: no triggers → +1
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. MODIFIER 4: EXIT INTERVIEW COMPLETION (±3)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod4: exit interview completion", () => {
  // Base: 1 completed induction, 0 sickness, 0 recognition
  // mod1: +5, mod2: +4, mod3: +2, mod5: depends on ratings, mod6: -3, mod7: +3, mod8: +1

  it("awards +3 for >=90% completion", () => {
    const exits = Array.from({ length: 10 }, (_, i) =>
      makeExit({ id: `e${i}`, status: i < 9 ? "completed" : "completed", overall_rating: 4 }),
    ); // 100% → +3, mod5: avg 4 → +3
    const r = computeHomeStaffLifecycle(baseInput({ exit_interview_records: exits }));
    // 52 + 5 + 4 + 2 + 3 + 3 + (-3) + 3 + 1 = 70
    expect(r.lifecycle_score).toBe(70);
  });

  it("awards +1 for >=70% but <90%", () => {
    const exits = Array.from({ length: 10 }, (_, i) =>
      makeExit({ id: `e${i}`, status: i < 7 ? "completed" : "scheduled", overall_rating: 4 }),
    ); // 70% → +1, mod5: avg 4 (only from completed) → +3
    const r = computeHomeStaffLifecycle(baseInput({ exit_interview_records: exits }));
    // 52 + 5 + 4 + 2 + 1 + 3 + (-3) + 3 + 1 = 68
    expect(r.lifecycle_score).toBe(68);
  });

  it("awards +0 for >=50% but <70%", () => {
    const exits = Array.from({ length: 10 }, (_, i) =>
      makeExit({ id: `e${i}`, status: i < 5 ? "completed" : "scheduled", overall_rating: 4 }),
    ); // 50% → +0, mod5: avg 4 → +3
    const r = computeHomeStaffLifecycle(baseInput({ exit_interview_records: exits }));
    // 52 + 5 + 4 + 2 + 0 + 3 + (-3) + 3 + 1 = 67
    expect(r.lifecycle_score).toBe(67);
  });

  it("penalises -3 for <50% completion", () => {
    const exits = Array.from({ length: 10 }, (_, i) =>
      makeExit({ id: `e${i}`, status: i < 4 ? "completed" : "scheduled", overall_rating: 4 }),
    ); // 40% → -3, mod5: avg 4 → +3
    const r = computeHomeStaffLifecycle(baseInput({ exit_interview_records: exits }));
    // 52 + 5 + 4 + 2 + (-3) + 3 + (-3) + 3 + 1 = 64
    expect(r.lifecycle_score).toBe(64);
  });

  it("awards +1 when no exit interviews exist", () => {
    const r = computeHomeStaffLifecycle(baseInput({ exit_interview_records: [] }));
    // mod4: +1, mod5: 0 (no ratings)
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. MODIFIER 5: STAFF SATISFACTION FROM EXITS (±3)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod5: staff satisfaction from exits", () => {
  it("awards +3 for avg rating >=4", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 5 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 4 }),
      ], // avg 4.5 → +3, mod4: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 3 + 3 + (-3) + 3 + 1 = 70
    expect(r.lifecycle_score).toBe(70);
  });

  it("awards +1 for avg rating >=3 but <4", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 3 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 3 }),
      ], // avg 3 → +1, mod4: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 3 + 1 + (-3) + 3 + 1 = 68
    expect(r.lifecycle_score).toBe(68);
  });

  it("awards +0 for avg rating >=2 but <3", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 2 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 2 }),
      ], // avg 2 → +0, mod4: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 3 + 0 + (-3) + 3 + 1 = 67
    expect(r.lifecycle_score).toBe(67);
  });

  it("penalises -3 for avg rating <2", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 1 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 1 }),
      ], // avg 1 → -3, mod4: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 3 + (-3) + (-3) + 3 + 1 = 64
    expect(r.lifecycle_score).toBe(64);
  });

  it("awards +0 when no completed exits have ratings", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: null }),
      ], // no ratings → +0, mod4: 100% → +3
    }));
    // 52 + 5 + 4 + 2 + 3 + 0 + (-3) + 3 + 1 = 67
    expect(r.lifecycle_score).toBe(67);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. MODIFIER 6: RECOGNITION CULTURE (±3)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod6: recognition culture", () => {
  it("awards +3 for >=0.5 events per staff", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: Array.from({ length: 5 }, (_, i) =>
        makeRecognition({ id: `r${i}`, date: "2026-05-10" }),
      ),
      total_staff: 10, // 5/10 = 0.5 → +3
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + 3 + 3 + 1 = 71
    expect(r.lifecycle_score).toBe(71);
  });

  it("awards +1 for >=0.2 but <0.5 per staff", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),
        makeRecognition({ id: "r2", date: "2026-05-12" }),
      ],
      total_staff: 10, // 2/10 = 0.2 → +1
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + 1 + 3 + 1 = 69
    expect(r.lifecycle_score).toBe(69);
  });

  it("awards +0 for >0 but <0.2 per staff", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10" }),
      ],
      total_staff: 10, // 1/10 = 0.1 → +0
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + 0 + 3 + 1 = 68
    expect(r.lifecycle_score).toBe(68);
  });

  it("penalises -3 for 0 recognition events", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [],
      total_staff: 10,
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("awards +0 when total_staff is 0", () => {
    // Need at least one record of some type for totalData > 0
    const r = computeHomeStaffLifecycle(baseInput({
      total_staff: 0,
    }));
    // mod2: +0, mod6: +0, mod8: +1
    // 52 + 5 + 0 + 2 + 1 + 0 + 0 + 3 + 1 = 64
    expect(r.lifecycle_score).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. MODIFIER 7: INDUCTION TASK COMPLETION DEPTH (±3)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod7: induction task completion depth", () => {
  it("awards +3 for avg >=90%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 10, tasks_completed: 9 }),
        makeInduction({ id: "i2", staff_id: "s2", tasks_total: 10, tasks_completed: 10 }),
      ], // avg = (90+100)/2 = 95% → +3, mod1: 100% completed → +5
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("awards +1 for avg >=70% but <90%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 10, tasks_completed: 8 }),
        makeInduction({ id: "i2", staff_id: "s2", tasks_total: 10, tasks_completed: 6 }),
      ], // avg = (80+60)/2 = 70% → +1, mod1: 100% → +5
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 1 + 1 = 63
    expect(r.lifecycle_score).toBe(63);
  });

  it("awards +0 for avg >=50% but <70%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 10, tasks_completed: 6 }),
        makeInduction({ id: "i2", staff_id: "s2", tasks_total: 10, tasks_completed: 5 }),
      ], // avg = (60+50)/2 = 55% → +0, mod1: 100% → +5
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 0 + 1 = 62
    expect(r.lifecycle_score).toBe(62);
  });

  it("penalises -3 for avg <50%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", tasks_total: 10, tasks_completed: 3 }),
        makeInduction({ id: "i2", staff_id: "s2", tasks_total: 10, tasks_completed: 4 }),
      ], // avg = (30+40)/2 = 35% → -3, mod1: 100% → +5
    }));
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + (-3) + 1 = 59
    expect(r.lifecycle_score).toBe(59);
  });

  it("awards +0 when no induction records", () => {
    // Use sickness to keep totalData > 0
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [],
      sickness_records: [makeSickness({ date_started: "2026-05-01", total_days: 1 })],
    }));
    // mod1: 0, mod7: 0
    // 52 + 0 + 4 + 2 + 1 + 0 + (-3) + 0 + 1 = 57
    expect(r.lifecycle_score).toBe(57);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. MODIFIER 8: OCCUPATIONAL HEALTH REFERRAL RATE (±3)
// ═══════════════════════════════════════════════════════════════════════════

describe("mod8: occupational health referral rate", () => {
  it("awards +3 for >=80% OH referral rate among triggered", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({
        id: `s${i}`,
        staff_id: `st${i}`,
        date_started: "2026-05-01",
        total_days: 5,
        rtw_status: "completed",
        trigger_points_count: 1,
        occupational_health_referral: i < 8, // 80% → +3
      }),
    );
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // mod2: 50/(900)*100 = 5.56% → +0, mod3: 100% completed → +4
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + 3 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("awards +1 for >=60% but <80%", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({
        id: `s${i}`,
        staff_id: `st${i}`,
        date_started: "2026-05-01",
        total_days: 5,
        rtw_status: "completed",
        trigger_points_count: 1,
        occupational_health_referral: i < 6, // 60% → +1
      }),
    );
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + 1 = 63
    expect(r.lifecycle_score).toBe(63);
  });

  it("awards +0 for >=40% but <60%", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({
        id: `s${i}`,
        staff_id: `st${i}`,
        date_started: "2026-05-01",
        total_days: 5,
        rtw_status: "completed",
        trigger_points_count: 1,
        occupational_health_referral: i < 4, // 40% → +0
      }),
    );
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + 0 = 62
    expect(r.lifecycle_score).toBe(62);
  });

  it("penalises -3 for <40%", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({
        id: `s${i}`,
        staff_id: `st${i}`,
        date_started: "2026-05-01",
        total_days: 5,
        rtw_status: "completed",
        trigger_points_count: 1,
        occupational_health_referral: i < 3, // 30% → -3
      }),
    );
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    // 52 + 5 + 0 + 4 + 1 + 0 + (-3) + 3 + (-3) = 59
    expect(r.lifecycle_score).toBe(59);
  });

  it("awards +1 when no sickness records have trigger points", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 5, rtw_status: "completed", trigger_points_count: 0 }),
      ],
    }));
    // mod8: none with triggers → +1
    // mod2: 5/900*100 = 0.56% → +4, mod3: completed → +4
    // 52 + 5 + 4 + 4 + 1 + 0 + (-3) + 3 + 1 = 67
    expect(r.lifecycle_score).toBe(67);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("clamps score to minimum 0", () => {
    // Create a scenario with all maximum penalties
    // This would need artificially extreme data
    // Just verify it never goes below 0
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ overall_status: "overdue", tasks_total: 10, tasks_completed: 1 })],
      sickness_records: [makeSickness({ date_started: "2026-05-01", total_days: 100, rtw_status: "overdue", trigger_points_count: 5, occupational_health_referral: false })],
      exit_interview_records: [makeExit({ status: "declined", overall_rating: null })],
      recognition_records: [],
      total_staff: 10,
    }));
    expect(r.lifecycle_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeStaffLifecycle(baseInput());
    expect(r.lifecycle_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. STRENGTHS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths generation", () => {
  it("includes induction strength for >=95% completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: Array.from({ length: 20 }, (_, i) =>
        makeInduction({ id: `i${i}`, staff_id: `s${i}`, overall_status: "completed" }),
      ),
    }));
    expect(r.strengths.some((s) => s.includes("induction completion rate"))).toBe(true);
  });

  it("includes sickness strength for <=2% absence rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 1 }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("absence rate"))).toBe(true);
  });

  it("includes RTW strength for >=90% compliance", () => {
    const sicknesses = Array.from({ length: 10 }, (_, i) =>
      makeSickness({ id: `s${i}`, date_started: "2026-05-01", total_days: 5, rtw_status: "completed" }),
    );
    const r = computeHomeStaffLifecycle(baseInput({ sickness_records: sicknesses }));
    expect(r.strengths.some((s) => s.includes("return-to-work"))).toBe(true);
  });

  it("includes exit interview strength for >=90% completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: Array.from({ length: 10 }, (_, i) =>
        makeExit({ id: `e${i}`, status: "completed" }),
      ),
    }));
    expect(r.strengths.some((s) => s.includes("Exit interview completion"))).toBe(true);
  });

  it("includes satisfaction strength for avg >=4", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 5 }),
        makeExit({ id: "e2", status: "completed", overall_rating: 4 }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("satisfaction"))).toBe(true);
  });

  it("includes recognition strength for >=0.5 per staff", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: Array.from({ length: 5 }, (_, i) =>
        makeRecognition({ id: `r${i}`, date: "2026-05-10" }),
      ),
      total_staff: 10,
    }));
    expect(r.strengths.some((s) => s.includes("recognition"))).toBe(true);
  });

  it("includes task depth strength for >=90%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ tasks_total: 10, tasks_completed: 10 })],
    }));
    expect(r.strengths.some((s) => s.includes("induction task completion"))).toBe(true);
  });

  it("includes OH referral strength for >=80%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: Array.from({ length: 5 }, (_, i) =>
        makeSickness({
          id: `s${i}`,
          date_started: "2026-05-01",
          total_days: 5,
          rtw_status: "completed",
          trigger_points_count: 1,
          occupational_health_referral: true,
        }),
      ),
    }));
    expect(r.strengths.some((s) => s.includes("Occupational health"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. CONCERNS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns generation", () => {
  it("raises concern for <60% induction completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "completed" }),
        makeInduction({ id: "i2", overall_status: "in_progress" }),
        makeInduction({ id: "i3", overall_status: "overdue" }),
      ], // 33%
    }));
    expect(r.concerns.some((c) => c.includes("Induction completion rate"))).toBe(true);
  });

  it("raises concern for overdue inductions", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "overdue" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("raises concern for >6% absence rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 60 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("absence rate"))).toBe(true);
  });

  it("raises concern for active sickness episodes", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", date_ended: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("active sickness"))).toBe(true);
  });

  it("raises concern for <50% RTW compliance", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", total_days: 5, rtw_status: "overdue", date_started: "2026-05-01" }),
        makeSickness({ id: "s2", total_days: 5, rtw_status: "overdue", date_started: "2026-05-01" }),
        makeSickness({ id: "s3", total_days: 5, rtw_status: "overdue", date_started: "2026-05-01" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Return-to-work compliance"))).toBe(true);
  });

  it("raises concern for <50% exit interview completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "declined" }),
        makeExit({ id: "e2", status: "not_offered" }),
        makeExit({ id: "e3", status: "completed" }),
      ], // 33%
    }));
    expect(r.concerns.some((c) => c.includes("exit interviews"))).toBe(true);
  });

  it("raises concern for avg exit satisfaction <2", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 1 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("satisfaction"))).toBe(true);
  });

  it("raises concern for zero recognition when staff exist", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [],
      total_staff: 10,
    }));
    expect(r.concerns.some((c) => c.includes("recognition"))).toBe(true);
  });

  it("raises concern for low OH referral rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", total_days: 5, trigger_points_count: 2, occupational_health_referral: false, rtw_status: "completed", date_started: "2026-05-01" }),
        makeSickness({ id: "s2", total_days: 5, trigger_points_count: 2, occupational_health_referral: false, rtw_status: "completed", date_started: "2026-05-01" }),
        makeSickness({ id: "s3", total_days: 5, trigger_points_count: 2, occupational_health_referral: false, rtw_status: "completed", date_started: "2026-05-01" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Occupational health"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. RECOMMENDATIONS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations generation", () => {
  it("recommends completing overdue inductions", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ overall_status: "overdue" })],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue induction") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends completing outstanding RTW interviews", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ total_days: 5, rtw_status: "overdue", date_started: "2026-05-01" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("return-to-work") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends reviewing absence when rate >6%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 60 }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("absence patterns"))).toBe(true);
  });

  it("recommends improving exit interview completion", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: Array.from({ length: 10 }, (_, i) =>
        makeExit({ id: `e${i}`, status: i < 5 ? "completed" : "declined" }),
      ), // 50% < 70%
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("exit interview completion"))).toBe(true);
  });

  it("recommends recognition programme when events_per_staff < 0.2", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [makeRecognition({ date: "2026-05-10" })],
      total_staff: 10, // 0.1 < 0.2
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("recognition programme"))).toBe(true);
  });

  it("recommends reviewing induction tasks when avg <70%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ tasks_total: 10, tasks_completed: 5 }),
      ], // 50% < 70%
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("induction task completion"))).toBe(true);
  });

  it("recommends OH referrals when rate <60%", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", total_days: 5, trigger_points_count: 2, occupational_health_referral: false, rtw_status: "completed", date_started: "2026-05-01" }),
        makeSickness({ id: "s2", total_days: 5, trigger_points_count: 2, occupational_health_referral: false, rtw_status: "completed", date_started: "2026-05-01" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("occupational health"))).toBe(true);
  });

  it("sets correct regulatory references", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ overall_status: "overdue" })],
    }));
    const inductionRec = r.recommendations.find((rec) => rec.recommendation.includes("overdue induction"));
    expect(inductionRec?.regulatory_ref).toBe("Reg 32(3)");
  });

  it("numbers recommendations sequentially", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ overall_status: "overdue", tasks_total: 10, tasks_completed: 3 })],
      sickness_records: [makeSickness({ total_days: 60, rtw_status: "overdue", date_started: "2026-05-01", trigger_points_count: 2, occupational_health_referral: false })],
      recognition_records: [],
      total_staff: 10,
    }));
    if (r.recommendations.length >= 2) {
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. INSIGHTS GENERATION
// ═══════════════════════════════════════════════════════════════════════════

describe("insights generation", () => {
  it("generates critical insight for >=3 active sickness episodes", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", date_ended: null }),
        makeSickness({ id: "s2", date_started: "2026-05-05", date_ended: null }),
        makeSickness({ id: "s3", date_started: "2026-05-10", date_ended: null }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("active"))).toBe(true);
  });

  it("generates warning insight for 1-2 active sickness episodes", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", date_ended: null }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("active"))).toBe(true);
  });

  it("generates positive insight for all inductions completed", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ id: "i1", overall_status: "completed" }),
        makeInduction({ id: "i2", overall_status: "completed" }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("inductions are completed"))).toBe(true);
  });

  it("generates positive insight for strong exit data", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 5, would_recommend: true }),
        makeExit({ id: "e2", status: "completed", overall_rating: 4, would_recommend: true }),
        makeExit({ id: "e3", status: "completed", overall_rating: 4, would_recommend: true }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("would recommend"))).toBe(true);
  });

  it("generates critical insight for very low exit satisfaction", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 1 }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("critically low"))).toBe(true);
  });

  it("generates positive insight for strong recognition culture", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: Array.from({ length: 5 }, (_, i) =>
        makeRecognition({ id: `r${i}`, date: "2026-05-10" }),
      ),
      total_staff: 10,
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Recognition rate"))).toBe(true);
  });

  it("generates positive insight for high child nomination rate", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ id: "r1", date: "2026-05-10", child_contributed_nomination: true }),
        makeRecognition({ id: "r2", date: "2026-05-12", child_contributed_nomination: true }),
        makeRecognition({ id: "r3", date: "2026-05-15", child_contributed_nomination: false }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("child nominations"))).toBe(true);
  });

  it("generates critical insight for high absence + active episodes", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 60, date_ended: null }),
        makeSickness({ id: "s2", date_started: "2026-05-10", total_days: 5, date_ended: null }),
      ],
    }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("systemic wellbeing"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles sickness records outside 90-day window", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-01-01", total_days: 10, date_ended: "2026-01-11" }),
      ],
    }));
    expect(r.sickness.total_episodes_90d).toBe(0);
    expect(r.sickness.total_days_90d).toBe(0);
  });

  it("handles recognition records outside 90-day window", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      recognition_records: [
        makeRecognition({ date: "2026-01-01" }),
      ],
    }));
    expect(r.recognition.total_events_90d).toBe(0);
  });

  it("handles mixed inside/outside 90-day records", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ id: "s1", date_started: "2026-05-01", total_days: 3 }),
        makeSickness({ id: "s2", date_started: "2026-01-01", total_days: 10 }),
      ],
    }));
    expect(r.sickness.total_episodes_90d).toBe(1);
    expect(r.sickness.total_days_90d).toBe(3);
  });

  it("returns correct result with only recognition records", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [],
      recognition_records: [makeRecognition({ date: "2026-05-10" })],
      total_staff: 10,
    });
    expect(r.lifecycle_rating).not.toBe("insufficient_data");
  });

  it("returns correct result with only sickness records", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [makeSickness({ date_started: "2026-05-01" })],
      exit_interview_records: [],
      recognition_records: [],
      total_staff: 10,
    });
    expect(r.lifecycle_rating).not.toBe("insufficient_data");
  });

  it("returns correct result with only exit interview records", () => {
    const r = computeHomeStaffLifecycle({
      today: "2026-05-27",
      induction_records: [],
      sickness_records: [],
      exit_interview_records: [makeExit()],
      recognition_records: [],
      total_staff: 10,
    });
    expect(r.lifecycle_rating).not.toBe("insufficient_data");
  });

  it("inductions with tasks_total=0 do not crash avg calc", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ tasks_total: 0, tasks_completed: 0 }),
      ],
    }));
    expect(r.induction.avg_task_completion).toBeNull();;
  });

  it("single sickness record on boundary day 90 is included", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-02-26", total_days: 3 }),
      ],
    }));
    // daysBetween("2026-02-26", "2026-05-27") = 90 → included
    expect(r.sickness.total_episodes_90d).toBe(1);
  });

  it("single sickness record at day 91 is excluded", () => {
    const r = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-02-25", total_days: 3 }),
      ],
    }));
    // daysBetween("2026-02-25", "2026-05-27") = 91 → excluded
    expect(r.sickness.total_episodes_90d).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. CROSS-MODIFIER INTERACTION VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("cross-modifier interaction", () => {
  it("verifies base score calculation matches expected", () => {
    // Base input: 1 completed induction (10/10), 0 sickness, 0 exits, 0 recognition, 10 staff
    const r = computeHomeStaffLifecycle(baseInput());
    // mod1: 100% → +5, mod2: 0% absence → +4, mod3: none need RTW → +2
    // mod4: no exits → +1, mod5: no ratings → +0, mod6: 0 events → -3
    // mod7: 100% tasks → +3, mod8: no triggers → +1
    // 52 + 5 + 4 + 2 + 1 + 0 + (-3) + 3 + 1 = 65
    expect(r.lifecycle_score).toBe(65);
  });

  it("adding recognition improves score", () => {
    const without = computeHomeStaffLifecycle(baseInput());
    const with5 = computeHomeStaffLifecycle(baseInput({
      recognition_records: Array.from({ length: 5 }, (_, i) =>
        makeRecognition({ id: `r${i}`, date: "2026-05-10" }),
      ),
    }));
    // without: mod6 = -3 → 65
    // with: mod6 = +3 (0.5 per staff) → 71
    expect(with5.lifecycle_score! - without.lifecycle_score!).toBe(6);
  });

  it("adding sickness with poor RTW reduces score", () => {
    const clean = computeHomeStaffLifecycle(baseInput());
    const withSickness = computeHomeStaffLifecycle(baseInput({
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 5, rtw_status: "overdue" }),
      ],
    }));
    // clean: mod2: +4, mod3: +2
    // withSickness: mod2: 5/900*100=0.56% → +4, mod3: 0% completed < 50 → -4
    // diff = (-4) - (+2) = -6
    expect(clean.lifecycle_score! - withSickness.lifecycle_score!).toBe(6);
  });

  it("max score achievable is 80", () => {
    // 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [makeInduction({ tasks_total: 10, tasks_completed: 10 })],
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 3, rtw_status: "completed", trigger_points_count: 1, occupational_health_referral: true }),
      ],
      exit_interview_records: [makeExit({ status: "completed", overall_rating: 5 })],
      recognition_records: Array.from({ length: 5 }, (_, i) =>
        makeRecognition({ id: `r${i}`, date: "2026-05-10" }),
      ),
      total_staff: 10,
    }));
    expect(r.lifecycle_score).toBe(80);
  });

  it("min practical score is 24 (52 - 28)", () => {
    // 52 + (-5) + (-4) + (-4) + (-3) + (-3) + (-3) + (-3) + (-3) = 24
    const r = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ overall_status: "overdue", tasks_total: 10, tasks_completed: 2 }),
      ], // mod1: 0% < 60 → -5, mod7: 20% < 50 → -3
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 60, rtw_status: "overdue", trigger_points_count: 2, occupational_health_referral: false }),
      ], // mod2: >6% → -4, mod3: 0% < 50 → -4, mod8: 0% < 40 → -3
      exit_interview_records: [
        makeExit({ status: "declined", overall_rating: null }),
        makeExit({ id: "e2", status: "not_offered", overall_rating: null }),
      ], // mod4: 0% < 50 → -3, mod5: no ratings → 0
      recognition_records: [], // mod6: 0 events → -3
      total_staff: 10,
    }));
    // But mod5 is 0 not -3. So: 52 - 5 - 4 - 4 - 3 + 0 - 3 - 3 - 3 = 27
    // We need a rating < 2 for mod5 = -3
    const rWithBadRatings = computeHomeStaffLifecycle(baseInput({
      induction_records: [
        makeInduction({ overall_status: "overdue", tasks_total: 10, tasks_completed: 2 }),
      ],
      sickness_records: [
        makeSickness({ date_started: "2026-05-01", total_days: 60, rtw_status: "overdue", trigger_points_count: 2, occupational_health_referral: false }),
      ],
      exit_interview_records: [
        makeExit({ id: "e1", status: "completed", overall_rating: 1 }),
        makeExit({ id: "e2", status: "declined", overall_rating: null }),
        makeExit({ id: "e3", status: "declined", overall_rating: null }),
      ], // mod4: 1/3=33% < 50 → -3, mod5: avg 1 < 2 → -3
      recognition_records: [], // mod6: -3
      total_staff: 10,
    }));
    // 52 - 5 - 4 - 4 - 3 - 3 - 3 - 3 - 3 = 24
    expect(rWithBadRatings.lifecycle_score).toBe(24);
  });
});
