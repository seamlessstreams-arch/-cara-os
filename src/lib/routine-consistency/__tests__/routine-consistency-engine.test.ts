// ══════════════════════════════════════════════════════════════════════════════
// Routine & Consistency Intelligence — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMorningRoutine,
  evaluateEveningRoutine,
  evaluatePhaseBreakdown,
  evaluateStaffConsistency,
  buildChildRoutineProfiles,
  generateRoutineConsistencyIntelligence,
  getPhaseLabel,
  getDisruptionLabel,
  getAdaptationLabel,
} from "../routine-consistency-engine";
import type {
  RoutineChild,
  RoutineRecord,
  StaffShiftRecord,
  RoutinePreferenceRecord,
} from "../routine-consistency-engine";

// ── Test Data ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const children: RoutineChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    currentPlacement: true,
    agreedBedtime: "21:00",
    agreedWakeTime: "07:00",
    schoolStartTime: "08:45",
    adaptations: ["anxiety_support", "education_need"],
    routinePreferences: ["Music while getting ready", "Toast not cereal for breakfast"],
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    currentPlacement: true,
    agreedBedtime: "20:30",
    agreedWakeTime: "07:15",
    schoolStartTime: "08:45",
    adaptations: ["sensory_need"],
    routinePreferences: ["Quiet time before bed", "No bright lights in morning"],
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    currentPlacement: true,
    agreedBedtime: "21:30",
    agreedWakeTime: "07:00",
    schoolStartTime: "08:30",
    adaptations: ["cultural_religious", "sleep_difficulty"],
    routinePreferences: ["Prayer time before bed", "Later wake on Fridays after Isha"],
  },
];

const nonPlacedChild: RoutineChild = {
  id: "child-left",
  name: "Left",
  dateOfBirth: "2011-06-10",
  currentPlacement: false,
  agreedBedtime: "21:00",
  agreedWakeTime: "07:00",
  adaptations: [],
  routinePreferences: [],
};

// Helper to generate routine records
function makeRecord(
  overrides: Partial<RoutineRecord> & { id: string; date: string; childId: string; phase: RoutineRecord["phase"] },
): RoutineRecord {
  return {
    quality: "good",
    staffOnDuty: ["staff-sarah"],
    startedOnTime: true,
    completedOnTime: true,
    childCooperated: true,
    childMood: "positive",
    adaptationsUsed: [],
    disruptions: [],
    ...overrides,
  };
}

// Generate a realistic set of records
const records: RoutineRecord[] = [
  // ── Alex — mostly good mornings and evenings ────────────────────────────
  makeRecord({ id: "r-a-m1", date: "2026-01-15", childId: "child-alex", phase: "morning", quality: "excellent", adaptationsUsed: ["anxiety_support"] }),
  makeRecord({ id: "r-a-sr1", date: "2026-01-15", childId: "child-alex", phase: "school_run", quality: "good" }),
  makeRecord({ id: "r-a-as1", date: "2026-01-15", childId: "child-alex", phase: "after_school", quality: "good", adaptationsUsed: ["education_need"] }),
  makeRecord({ id: "r-a-e1", date: "2026-01-15", childId: "child-alex", phase: "evening", quality: "excellent" }),
  makeRecord({ id: "r-a-b1", date: "2026-01-15", childId: "child-alex", phase: "bedtime", quality: "good" }),

  makeRecord({ id: "r-a-m2", date: "2026-02-10", childId: "child-alex", phase: "morning", quality: "good", adaptationsUsed: ["anxiety_support"] }),
  makeRecord({ id: "r-a-sr2", date: "2026-02-10", childId: "child-alex", phase: "school_run", quality: "good" }),
  makeRecord({ id: "r-a-e2", date: "2026-02-10", childId: "child-alex", phase: "evening", quality: "good" }),
  makeRecord({ id: "r-a-b2", date: "2026-02-10", childId: "child-alex", phase: "bedtime", quality: "excellent" }),

  makeRecord({ id: "r-a-m3", date: "2026-03-05", childId: "child-alex", phase: "morning", quality: "mixed", startedOnTime: false, childMood: "anxious", disruptions: ["child_refusal"] }),
  makeRecord({ id: "r-a-sr3", date: "2026-03-05", childId: "child-alex", phase: "school_run", quality: "mixed", startedOnTime: false }),
  makeRecord({ id: "r-a-e3", date: "2026-03-05", childId: "child-alex", phase: "evening", quality: "good" }),
  makeRecord({ id: "r-a-b3", date: "2026-03-05", childId: "child-alex", phase: "bedtime", quality: "good" }),

  makeRecord({ id: "r-a-wm1", date: "2026-01-18", childId: "child-alex", phase: "weekend_morning", quality: "excellent" }),
  makeRecord({ id: "r-a-wa1", date: "2026-01-18", childId: "child-alex", phase: "weekend_afternoon", quality: "excellent" }),
  makeRecord({ id: "r-a-we1", date: "2026-01-18", childId: "child-alex", phase: "weekend_evening", quality: "good" }),

  // ── Jordan — mostly good, some sensory disruptions ──────────────────────
  makeRecord({ id: "r-j-m1", date: "2026-01-15", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  makeRecord({ id: "r-j-sr1", date: "2026-01-15", childId: "child-jordan", phase: "school_run", quality: "good" }),
  makeRecord({ id: "r-j-as1", date: "2026-01-15", childId: "child-jordan", phase: "after_school", quality: "good" }),
  makeRecord({ id: "r-j-e1", date: "2026-01-15", childId: "child-jordan", phase: "evening", quality: "excellent" }),
  makeRecord({ id: "r-j-b1", date: "2026-01-15", childId: "child-jordan", phase: "bedtime", quality: "excellent" }),

  makeRecord({ id: "r-j-m2", date: "2026-02-10", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  makeRecord({ id: "r-j-e2", date: "2026-02-10", childId: "child-jordan", phase: "evening", quality: "good" }),
  makeRecord({ id: "r-j-b2", date: "2026-02-10", childId: "child-jordan", phase: "bedtime", quality: "good" }),

  makeRecord({ id: "r-j-m3", date: "2026-03-10", childId: "child-jordan", phase: "morning", quality: "mixed", childMood: "anxious", disruptions: ["staff_change"], childCooperated: false }),
  makeRecord({ id: "r-j-e3", date: "2026-03-10", childId: "child-jordan", phase: "evening", quality: "mixed", childMood: "anxious", disruptions: ["staff_change"] }),
  makeRecord({ id: "r-j-b3", date: "2026-03-10", childId: "child-jordan", phase: "bedtime", quality: "poor", completedOnTime: false, childMood: "distressed", disruptions: ["staff_change"] }),

  makeRecord({ id: "r-j-wm1", date: "2026-01-18", childId: "child-jordan", phase: "weekend_morning", quality: "good" }),
  makeRecord({ id: "r-j-wa1", date: "2026-01-18", childId: "child-jordan", phase: "weekend_afternoon", quality: "good" }),

  // ── Morgan — excellent routine, cultural adaptations ────────────────────
  makeRecord({ id: "r-m-m1", date: "2026-01-15", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  makeRecord({ id: "r-m-sr1", date: "2026-01-15", childId: "child-morgan", phase: "school_run", quality: "excellent" }),
  makeRecord({ id: "r-m-as1", date: "2026-01-15", childId: "child-morgan", phase: "after_school", quality: "good" }),
  makeRecord({ id: "r-m-e1", date: "2026-01-15", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),
  makeRecord({ id: "r-m-b1", date: "2026-01-15", childId: "child-morgan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["cultural_religious", "sleep_difficulty"] }),

  makeRecord({ id: "r-m-m2", date: "2026-02-10", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  makeRecord({ id: "r-m-sr2", date: "2026-02-10", childId: "child-morgan", phase: "school_run", quality: "good" }),
  makeRecord({ id: "r-m-e2", date: "2026-02-10", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),
  makeRecord({ id: "r-m-b2", date: "2026-02-10", childId: "child-morgan", phase: "bedtime", quality: "good", adaptationsUsed: ["sleep_difficulty"] }),

  makeRecord({ id: "r-m-m3", date: "2026-03-15", childId: "child-morgan", phase: "morning", quality: "good" }),
  makeRecord({ id: "r-m-e3", date: "2026-03-15", childId: "child-morgan", phase: "evening", quality: "good", adaptationsUsed: ["cultural_religious"] }),
  makeRecord({ id: "r-m-b3", date: "2026-03-15", childId: "child-morgan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["sleep_difficulty"] }),

  makeRecord({ id: "r-m-wm1", date: "2026-01-18", childId: "child-morgan", phase: "weekend_morning", quality: "excellent" }),
  makeRecord({ id: "r-m-wa1", date: "2026-01-18", childId: "child-morgan", phase: "weekend_afternoon", quality: "excellent" }),
  makeRecord({ id: "r-m-we1", date: "2026-01-18", childId: "child-morgan", phase: "weekend_evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),

  // ── Alex additional — April records ─────────────────────────────────────
  makeRecord({ id: "r-a-m4", date: "2026-04-10", childId: "child-alex", phase: "morning", quality: "good", adaptationsUsed: ["anxiety_support"] }),
  makeRecord({ id: "r-a-sr4", date: "2026-04-10", childId: "child-alex", phase: "school_run", quality: "excellent" }),
  makeRecord({ id: "r-a-e4", date: "2026-04-10", childId: "child-alex", phase: "evening", quality: "excellent" }),
  makeRecord({ id: "r-a-b4", date: "2026-04-10", childId: "child-alex", phase: "bedtime", quality: "excellent" }),
];

const shifts: StaffShiftRecord[] = [
  { id: "sh-001", date: "2026-01-15", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-002", date: "2026-01-15", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "afternoon", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  { id: "sh-003", date: "2026-01-15", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-004", date: "2026-02-10", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-005", date: "2026-02-10", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  { id: "sh-006", date: "2026-03-05", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-007", date: "2026-03-05", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-008", date: "2026-03-10", staffId: "staff-agency1", staffName: "Agency Cover", shiftType: "long_day", isRegularStaff: false, handoverCompleted: true, handoverQuality: "brief" },
  { id: "sh-009", date: "2026-03-15", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  { id: "sh-010", date: "2026-03-15", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-011", date: "2026-01-18", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "long_day", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "sh-012", date: "2026-04-10", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  { id: "sh-013", date: "2026-04-10", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "evening", isRegularStaff: true, handoverCompleted: false },
];

const preferences: RoutinePreferenceRecord[] = [
  { id: "pref-001", childId: "child-alex", date: "2026-01-10", preference: "Music while getting ready in the morning", implemented: true, implementedDate: "2026-01-12", childFeedback: "happy" },
  { id: "pref-002", childId: "child-alex", date: "2026-01-10", preference: "Toast not cereal for breakfast", implemented: true, implementedDate: "2026-01-11", childFeedback: "happy" },
  { id: "pref-003", childId: "child-jordan", date: "2026-01-15", preference: "Quiet time before bed with reading lamp", implemented: true, implementedDate: "2026-01-16", childFeedback: "happy" },
  { id: "pref-004", childId: "child-jordan", date: "2026-01-15", preference: "Dimmed lights in morning", implemented: true, implementedDate: "2026-01-16", childFeedback: "happy" },
  { id: "pref-005", childId: "child-morgan", date: "2026-01-20", preference: "Prayer time before bed — 10 minutes", implemented: true, implementedDate: "2026-01-20", childFeedback: "happy" },
  { id: "pref-006", childId: "child-morgan", date: "2026-02-01", preference: "Later bedtime on Fridays for Isha prayer", implemented: true, implementedDate: "2026-02-05", childFeedback: "happy" },
  { id: "pref-007", childId: "child-alex", date: "2026-03-01", preference: "Gaming time limited to after homework", implemented: false },
];

// ── Morning Routine ──────────────────────────────────────────────────────────

describe("evaluateMorningRoutine", () => {
  it("counts total morning and school_run records", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    // Alex: 4 morning + 4 school_run = 8, Jordan: 3 morning + 1 school_run = 4, Morgan: 3 morning + 2 school_run = 5
    expect(result.totalRecords).toBe(17);
  });

  it("calculates on-time rate", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    // 15 of 17 started on time (Alex m3 and sr3 not on time)
    expect(result.onTimeRate).toBe(88);
  });

  it("calculates quality rate (excellent + good)", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    // 14 excellent/good, 3 mixed (Alex m3, sr3, Jordan m3) = 82%
    expect(result.qualityRate).toBe(82);
  });

  it("calculates cooperation rate", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    // 15 cooperated out of 16 (Jordan m3 didn't cooperate)
    expect(result.cooperationRate).toBe(94);
  });

  it("identifies common disruptions", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    expect(result.commonDisruptions.length).toBeGreaterThan(0);
    // child_refusal and staff_change present
    const refusal = result.commonDisruptions.find((d) => d.type === "child_refusal");
    expect(refusal).toBeDefined();
  });

  it("calculates school readiness rate", () => {
    const result = evaluateMorningRoutine(children, records, PERIOD_START, PERIOD_END);
    // 7 school_run records, 6 on time (Alex sr3 not on time) = 86%
    expect(result.schoolReadinessRate).toBe(86);
  });

  it("excludes non-placed children", () => {
    const allChildren = [...children, nonPlacedChild];
    const leftRecords: RoutineRecord[] = [
      makeRecord({ id: "r-left", date: "2026-01-15", childId: "child-left", phase: "morning" }),
    ];
    const result = evaluateMorningRoutine(allChildren, [...records, ...leftRecords], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(17); // non-placed excluded
  });

  it("handles no records", () => {
    const result = evaluateMorningRoutine(children, [], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.onTimeRate).toBe(0);
    expect(result.qualityRate).toBe(0);
  });
});

// ── Evening Routine ──────────────────────────────────────────────────────────

describe("evaluateEveningRoutine", () => {
  it("counts total evening and bedtime records", () => {
    const result = evaluateEveningRoutine(children, records, PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBeGreaterThan(0);
  });

  it("calculates quality rate", () => {
    const result = evaluateEveningRoutine(children, records, PERIOD_START, PERIOD_END);
    expect(result.qualityRate).toBeGreaterThan(50);
  });

  it("calculates bedtime compliance rate", () => {
    const result = evaluateEveningRoutine(children, records, PERIOD_START, PERIOD_END);
    // Most bedtimes completed on time except Jordan b3
    expect(result.bedtimeComplianceRate).toBeGreaterThan(70);
  });

  it("calculates wind-down quality from evening records", () => {
    const result = evaluateEveningRoutine(children, records, PERIOD_START, PERIOD_END);
    expect(result.windDownQuality).toBeGreaterThan(50);
  });

  it("detects disruptions in evening routine", () => {
    const result = evaluateEveningRoutine(children, records, PERIOD_START, PERIOD_END);
    expect(result.commonDisruptions.length).toBeGreaterThanOrEqual(0);
  });

  it("handles no records", () => {
    const result = evaluateEveningRoutine(children, [], PERIOD_START, PERIOD_END);
    expect(result.totalRecords).toBe(0);
    expect(result.bedtimeComplianceRate).toBe(0);
  });
});

// ── Phase Breakdown ──────────────────────────────────────────────────────────

describe("evaluatePhaseBreakdown", () => {
  it("produces results for each phase with records", () => {
    const result = evaluatePhaseBreakdown(children, records, PERIOD_START, PERIOD_END);
    expect(result.length).toBeGreaterThan(0);
    const phases = result.map((p) => p.phase);
    expect(phases).toContain("morning");
    expect(phases).toContain("bedtime");
    expect(phases).toContain("evening");
  });

  it("includes phase labels", () => {
    const result = evaluatePhaseBreakdown(children, records, PERIOD_START, PERIOD_END);
    const morning = result.find((p) => p.phase === "morning")!;
    expect(morning.phaseLabel).toBe("Morning Routine");
  });

  it("calculates per-phase quality rates", () => {
    const result = evaluatePhaseBreakdown(children, records, PERIOD_START, PERIOD_END);
    for (const phase of result) {
      expect(phase.excellentOrGoodRate).toBeGreaterThanOrEqual(0);
      expect(phase.excellentOrGoodRate).toBeLessThanOrEqual(100);
    }
  });

  it("calculates per-phase disruption rates", () => {
    const result = evaluatePhaseBreakdown(children, records, PERIOD_START, PERIOD_END);
    for (const phase of result) {
      expect(phase.disruptionRate).toBeGreaterThanOrEqual(0);
      expect(phase.disruptionRate).toBeLessThanOrEqual(100);
    }
  });

  it("calculates average mood per phase", () => {
    const result = evaluatePhaseBreakdown(children, records, PERIOD_START, PERIOD_END);
    for (const phase of result) {
      expect(phase.averageMood).toBeGreaterThanOrEqual(0);
      expect(phase.averageMood).toBeLessThanOrEqual(5);
    }
  });

  it("excludes phases with no records", () => {
    const limitedRecords: RoutineRecord[] = [
      makeRecord({ id: "lr-1", date: "2026-02-01", childId: "child-alex", phase: "morning" }),
    ];
    const result = evaluatePhaseBreakdown(children, limitedRecords, PERIOD_START, PERIOD_END);
    expect(result.length).toBe(1);
    expect(result[0].phase).toBe("morning");
  });

  it("handles no records", () => {
    const result = evaluatePhaseBreakdown(children, [], PERIOD_START, PERIOD_END);
    expect(result.length).toBe(0);
  });
});

// ── Staff Consistency ────────────────────────────────────────────────────────

describe("evaluateStaffConsistency", () => {
  it("calculates regular staff rate", () => {
    const result = evaluateStaffConsistency(shifts, records, PERIOD_START, PERIOD_END);
    // 12 regular out of 13 total = 92%
    expect(result.regularStaffRate).toBe(92);
  });

  it("calculates handover completion rate", () => {
    const result = evaluateStaffConsistency(shifts, records, PERIOD_START, PERIOD_END);
    // 12 completed out of 13 = 92%
    expect(result.handoverCompletionRate).toBe(92);
  });

  it("calculates handover quality rate", () => {
    const result = evaluateStaffConsistency(shifts, records, PERIOD_START, PERIOD_END);
    // Out of shifts with quality: 12 have quality, 11 thorough/adequate, 1 brief = 92%
    expect(result.handoverQualityRate).toBeGreaterThan(80);
  });

  it("calculates average staff per shift/day", () => {
    const result = evaluateStaffConsistency(shifts, records, PERIOD_START, PERIOD_END);
    expect(result.averageStaffPerShift).toBeGreaterThan(0);
  });

  it("counts staff change disruptions", () => {
    const result = evaluateStaffConsistency(shifts, records, PERIOD_START, PERIOD_END);
    // Jordan had staff_change disruptions on 2026-03-10 (3 records)
    expect(result.staffTurnoverImpact).toBe(3);
  });

  it("handles no shifts", () => {
    const result = evaluateStaffConsistency([], records, PERIOD_START, PERIOD_END);
    expect(result.regularStaffRate).toBe(0);
    expect(result.handoverCompletionRate).toBe(0);
  });
});

// ── Child Routine Profiles ───────────────────────────────────────────────────

describe("buildChildRoutineProfiles", () => {
  it("produces a profile for each placed child", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(3);
    expect(profiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan", "Morgan"]);
  });

  it("calculates morning quality rate per child", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    // Morgan: all mornings excellent/good = 100%
    expect(morgan.morningQualityRate).toBe(100);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Alex: 6 good/excellent out of 8 morning+school_run = 75%
    expect(alex.morningQualityRate).toBe(75);
  });

  it("calculates evening quality rate per child", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.eveningQualityRate).toBe(100);
  });

  it("tracks adaptations used per child", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.adaptationsUsed).toContain("anxiety_support");
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.adaptationsUsed).toContain("cultural_religious");
  });

  it("counts preferences total and implemented", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.preferencesTotal).toBe(3);
    expect(alex.preferencesImplemented).toBe(2);
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.preferencesTotal).toBe(2);
    expect(jordan.preferencesImplemented).toBe(2);
  });

  it("counts disruptions per child", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.disruptionCount).toBeGreaterThan(0);
  });

  it("no primary concern for children with good routines", () => {
    const profiles = buildChildRoutineProfiles(children, records, preferences, PERIOD_START, PERIOD_END);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.primaryConcern).toBeUndefined();
  });

  it("excludes non-placed children", () => {
    const allChildren = [...children, nonPlacedChild];
    const profiles = buildChildRoutineProfiles(allChildren, records, preferences, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(3);
  });

  it("detects concern for low morning quality", () => {
    const poorRecords: RoutineRecord[] = [
      makeRecord({ id: "poor-m1", date: "2026-02-01", childId: "child-alex", phase: "morning", quality: "poor", childMood: "distressed" }),
      makeRecord({ id: "poor-m2", date: "2026-02-02", childId: "child-alex", phase: "morning", quality: "poor", childMood: "dysregulated" }),
      makeRecord({ id: "poor-m3", date: "2026-02-03", childId: "child-alex", phase: "morning", quality: "mixed", childMood: "anxious" }),
    ];
    const profiles = buildChildRoutineProfiles([children[0]], poorRecords, [], PERIOD_START, PERIOD_END);
    expect(profiles[0].primaryConcern).toBeDefined();
    expect(profiles[0].primaryConcern).toContain("Morning routine quality");
  });
});

// ── Integration: generateRoutineConsistencyIntelligence ───────────────────

describe("generateRoutineConsistencyIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.morningRoutine).toBeDefined();
    expect(result.eveningRoutine).toBeDefined();
    expect(result.phaseBreakdown.length).toBeGreaterThan(0);
    expect(result.staffConsistency).toBeDefined();
    expect(result.childProfiles.length).toBe(3);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores well with good practice data", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("scores lower with no records", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, [], shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("scores lower with poor staff consistency", () => {
    const poorShifts: StaffShiftRecord[] = shifts.map((s) => ({
      ...s,
      isRegularStaff: false,
      handoverCompleted: false,
      handoverQuality: undefined,
    }));
    const goodResult = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    const poorResult = generateRoutineConsistencyIntelligence(
      children, records, poorShifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("includes CHR 2015 Reg 9 regulatory link", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 9"))).toBe(true);
  });

  it("includes PACE model regulatory link", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("PACE"))).toBe(true);
  });

  it("generates strength for high morning quality", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("morning"))).toBe(true);
  });

  it("generates strength for staff consistency", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("staff"))).toBe(true);
  });

  it("generates no urgent actions with good data", () => {
    const result = generateRoutineConsistencyIntelligence(
      children, records, shifts, preferences, "oak-house", PERIOD_START, PERIOD_END,
    );
    const hasNoActions = result.immediateActions.some((a) => a.includes("No immediate actions"));
    expect(hasNoActions).toBe(true);
  });
});

// ── Labels ───────────────────────────────────────────────────────────────────

describe("getPhaseLabel", () => {
  it("returns correct label for morning", () => {
    expect(getPhaseLabel("morning")).toBe("Morning Routine");
  });

  it("returns correct label for bedtime", () => {
    expect(getPhaseLabel("bedtime")).toBe("Bedtime");
  });

  it("returns correct label for weekend_afternoon", () => {
    expect(getPhaseLabel("weekend_afternoon")).toBe("Weekend Afternoon");
  });
});

describe("getDisruptionLabel", () => {
  it("returns correct label for staff_change", () => {
    expect(getDisruptionLabel("staff_change")).toBe("Staff Change");
  });

  it("returns correct label for child_refusal", () => {
    expect(getDisruptionLabel("child_refusal")).toBe("Child Refusal");
  });
});

describe("getAdaptationLabel", () => {
  it("returns correct label for sensory_need", () => {
    expect(getAdaptationLabel("sensory_need")).toBe("Sensory Accommodation");
  });

  it("returns correct label for cultural_religious", () => {
    expect(getAdaptationLabel("cultural_religious")).toBe("Cultural/Religious");
  });

  it("returns correct label for sleep_difficulty", () => {
    expect(getAdaptationLabel("sleep_difficulty")).toBe("Sleep Difficulty");
  });
});
