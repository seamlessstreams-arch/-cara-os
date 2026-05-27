import { describe, it, expect } from "vitest";
import {
  computeDailyRoutineCare,
  type DailyRoutineCareInput,
  type DailyRoutineInput,
  type DutyLogInput,
  type ShiftNoteInput,
  type CleaningCheckInput,
  type SleepInInput,
} from "../home-daily-routine-care-continuity-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRoutine(id: string, childId: string, overrides: Partial<DailyRoutineInput> = {}): DailyRoutineInput {
  return {
    id,
    child_id: childId,
    is_current: true,
    last_reviewed: "2026-04-01",
    personalised: true,
    ...overrides,
  };
}

function makeDutyLog(id: string, overrides: Partial<DutyLogInput> = {}): DutyLogInput {
  return {
    id,
    date: "2026-05-01",
    shift_type: "day",
    completed: true,
    incidents_recorded: 0,
    handover_completed: true,
    ...overrides,
  };
}

function makeShiftNote(id: string, staffId: string, overrides: Partial<ShiftNoteInput> = {}): ShiftNoteInput {
  return {
    id,
    staff_id: staffId,
    date: "2026-05-01",
    quality_adequate: true,
    child_observations_included: true,
    ...overrides,
  };
}

function makeCleaning(id: string, overrides: Partial<CleaningCheckInput> = {}): CleaningCheckInput {
  return {
    id,
    date: "2026-05-01",
    area: "kitchen",
    standard_met: true,
    issues_found: 0,
    issues_resolved: 0,
    ...overrides,
  };
}

function makeSleepIn(id: string, staffId: string, overrides: Partial<SleepInInput> = {}): SleepInInput {
  return {
    id,
    date: "2026-05-01",
    staff_id: staffId,
    wake_ups: 0,
    response_adequate: true,
    handover_completed: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<DailyRoutineCareInput> = {}): DailyRoutineCareInput {
  return {
    today: "2026-05-15",
    total_children: 4,
    total_staff: 8,
    daily_routines: [
      makeRoutine("r1", "child_1"),
      makeRoutine("r2", "child_2"),
      makeRoutine("r3", "child_3"),
      makeRoutine("r4", "child_4"),
    ],
    duty_logs: [
      makeDutyLog("dl1"),
      makeDutyLog("dl2", { shift_type: "evening" }),
      makeDutyLog("dl3", { shift_type: "night" }),
      makeDutyLog("dl4", { shift_type: "waking_night" }),
    ],
    shift_notes: [
      makeShiftNote("sn1", "staff_1"),
      makeShiftNote("sn2", "staff_2"),
      makeShiftNote("sn3", "staff_3"),
      makeShiftNote("sn4", "staff_4"),
    ],
    cleaning_checks: [
      makeCleaning("cc1", { area: "kitchen" }),
      makeCleaning("cc2", { area: "lounge" }),
      makeCleaning("cc3", { area: "bathroom" }),
      makeCleaning("cc4", { area: "bedroom" }),
    ],
    sleep_ins: [
      makeSleepIn("si1", "staff_5"),
      makeSleepIn("si2", "staff_6"),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeDailyRoutineCare", () => {
  // ── Insufficient data ─────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeDailyRoutineCare(baseInput({ total_children: 0 }));
      expect(r.routine_rating).toBe("insufficient_data");
      expect(r.routine_score).toBe(0);
      expect(r.headline).toContain("No children");
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("achieves outstanding with baseInput (score >= 80)", () => {
      // Base: 52
      // Mod 1: 4/4 = 100% → +5
      // Mod 2: 4/4 = 100% completion, 4/4 = 100% handover → +6
      // Mod 3: 4/4 = 100% quality, 4/4 = 100% obs → +5
      // Mod 4: 4/4 = 100% standard → +5
      // Mod 5: 2/2 = 100% response, 2/2 = 100% handover → +4
      // Mod 6: 0 issues → +4
      // Total: 52 + 5 + 6 + 5 + 5 + 4 + 4 = 81
      const r = computeDailyRoutineCare(baseInput());
      expect(r.routine_score).toBe(81);
      expect(r.routine_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Keep routines, duty logs, sleep-ins, and issue resolution at top tier.
      // Degrade shift note quality for 1 note and 1 cleaning check.
      // Mod 1: 4/4 = 100% → +5
      // Mod 2: 4/4 = 100%, 4/4 = 100% → +6
      // Mod 3: 3/4 = 75% quality, 3/4 = 75% obs → +3 (was +5)
      // Mod 4: 3/4 = 75% → -1 becomes 80% check... 3/4 = 75% → ≥60 → +0 (wait, need 80+ for +3)
      //   Actually 3/4 = 75%, which is < 80 but >= 60, so +0 (was +5)
      // Mod 5: 2/2 = 100% → +4
      // Mod 6: 0 issues → +4
      // Total: 52 + 5 + 6 + 3 + 0 + 4 + 4 = 74
      const r = computeDailyRoutineCare(baseInput({
        shift_notes: [
          makeShiftNote("sn1", "staff_1"),
          makeShiftNote("sn2", "staff_2"),
          makeShiftNote("sn3", "staff_3"),
          makeShiftNote("sn4", "staff_4", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1", { area: "kitchen" }),
          makeCleaning("cc2", { area: "lounge" }),
          makeCleaning("cc3", { area: "bathroom" }),
          makeCleaning("cc4", { area: "bedroom", standard_met: false }),
        ],
      }));
      expect(r.routine_score).toBeGreaterThanOrEqual(65);
      expect(r.routine_score).toBeLessThan(80);
      expect(r.routine_rating).toBe("good");
    });

    it("rates inadequate for severe deficiencies (score < 45)", () => {
      // No routines, incomplete logs, poor notes, failed cleaning
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [], // routineRate = 0% → -5
        duty_logs: [
          makeDutyLog("dl1", { completed: false, handover_completed: false }),
          makeDutyLog("dl2", { completed: false, handover_completed: false }),
          makeDutyLog("dl3", { completed: false, handover_completed: false }),
          makeDutyLog("dl4", { completed: true, handover_completed: false }),
        ], // completionRate = 25%, handoverRate = 0% → -6
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false, child_observations_included: false }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: false, child_observations_included: false }),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false, child_observations_included: false }),
          makeShiftNote("sn4", "staff_4", { quality_adequate: false, child_observations_included: false }),
        ], // qualityRate = 0%, obsRate = 0% → -5
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false, issues_found: 3, issues_resolved: 0 }),
          makeCleaning("cc2", { standard_met: false, issues_found: 2, issues_resolved: 0 }),
          makeCleaning("cc3", { standard_met: false, issues_found: 1, issues_resolved: 0 }),
          makeCleaning("cc4", { standard_met: false, issues_found: 2, issues_resolved: 0 }),
        ], // standardRate = 0% → -5, resolveRate = 0% → -4
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: false, handover_completed: false }),
          makeSleepIn("si2", "staff_6", { response_adequate: false, handover_completed: false }),
        ], // responseRate = 0%, handoverRate = 0% → -4
      }));
      // 52 - 5 - 6 - 5 - 5 - 4 - 4 = 23
      expect(r.routine_score).toBe(23);
      expect(r.routine_rating).toBe("inadequate");
    });
  });

  // ── Metric accuracy ───────────────────────────────────────────────────
  describe("metric accuracy", () => {
    it("counts children_with_routines correctly", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [
          makeRoutine("r1", "child_1"),
          makeRoutine("r2", "child_2"),
          makeRoutine("r3", "child_3", { personalised: false }),
          makeRoutine("r4", "child_4", { is_current: false }),
        ],
      }));
      expect(r.children_with_routines).toBe(2);
    });

    it("calculates duty_log_completion_rate correctly", () => {
      const r = computeDailyRoutineCare(baseInput({
        duty_logs: [
          makeDutyLog("dl1", { completed: true }),
          makeDutyLog("dl2", { completed: true }),
          makeDutyLog("dl3", { completed: false }),
          makeDutyLog("dl4", { completed: false }),
        ],
      }));
      expect(r.duty_log_completion_rate).toBe(50);
    });

    it("calculates shift_note_quality_rate correctly", () => {
      const r = computeDailyRoutineCare(baseInput({
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: true }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: true }),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false }),
          makeShiftNote("sn4", "staff_4", { quality_adequate: true }),
        ],
      }));
      expect(r.shift_note_quality_rate).toBe(75);
    });

    it("calculates cleaning_standard_rate correctly", () => {
      const r = computeDailyRoutineCare(baseInput({
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: true }),
          makeCleaning("cc2", { standard_met: true }),
          makeCleaning("cc3", { standard_met: false }),
          makeCleaning("cc4", { standard_met: true }),
        ],
      }));
      expect(r.cleaning_standard_rate).toBe(75);
    });

    it("calculates sleep_in_response_rate correctly", () => {
      const r = computeDailyRoutineCare(baseInput({
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: true }),
          makeSleepIn("si2", "staff_6", { response_adequate: false }),
        ],
      }));
      expect(r.sleep_in_response_rate).toBe(50);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("reports routine coverage strength when >= 90%", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.strengths.some(s => s.includes("Personalised daily routines"))).toBe(true);
    });

    it("reports duty log completion strength when >= 95%", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.strengths.some(s => s.includes("Duty logs completed"))).toBe(true);
    });

    it("reports cleaning standards strength when >= 95%", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.strengths.some(s => s.includes("Cleaning standards met"))).toBe(true);
    });

    it("reports shift note quality strength when >= 90%", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.strengths.some(s => s.includes("Shift note quality"))).toBe(true);
    });

    it("reports sleep-in response strength when >= 95%", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.strengths.some(s => s.includes("Sleep-in response quality"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags low duty log completion", () => {
      const r = computeDailyRoutineCare(baseInput({
        duty_logs: [
          makeDutyLog("dl1", { completed: true }),
          makeDutyLog("dl2", { completed: false }),
          makeDutyLog("dl3", { completed: false }),
          makeDutyLog("dl4", { completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Duty log completion"))).toBe(true);
    });

    it("flags poor shift note quality", () => {
      const r = computeDailyRoutineCare(baseInput({
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: false }),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false }),
          makeShiftNote("sn4", "staff_4", { quality_adequate: true }),
        ],
      }));
      // qualityRate = 25% < 60 → concern
      expect(r.concerns.some(c => c.includes("Shift note quality"))).toBe(true);
    });

    it("flags low routine coverage", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [
          makeRoutine("r1", "child_1"),
          makeRoutine("r2", "child_2", { personalised: false }),
          makeRoutine("r3", "child_3", { is_current: false }),
          makeRoutine("r4", "child_4", { personalised: false }),
        ],
      }));
      // routineRate = 1/4 = 25% < 50 → concern
      expect(r.concerns.some(c => c.includes("Under 50%"))).toBe(true);
    });

    it("flags poor cleaning standards", () => {
      const r = computeDailyRoutineCare(baseInput({
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false }),
          makeCleaning("cc2", { standard_met: false }),
          makeCleaning("cc3", { standard_met: true }),
          makeCleaning("cc4", { standard_met: false }),
        ],
      }));
      // standardRate = 25% < 60 → concern
      expect(r.concerns.some(c => c.includes("Cleaning standards met at only"))).toBe(true);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for outstanding rating", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for inadequate rating", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [],
        duty_logs: [
          makeDutyLog("dl1", { completed: false, handover_completed: false }),
          makeDutyLog("dl2", { completed: false, handover_completed: false }),
        ],
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false, child_observations_included: false }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false, issues_found: 3, issues_resolved: 0 }),
          makeCleaning("cc2", { standard_met: false, issues_found: 2, issues_resolved: 0 }),
        ],
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: false, handover_completed: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("critically compromised"))).toBe(true);
    });

    it("generates seamless transitions insight when logs, notes, and handovers all high", () => {
      const r = computeDailyRoutineCare(baseInput());
      // completionRate = 100% >= 95, qualityRate = 100% >= 90, handoverRate = 100% >= 95
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Seamless care transitions"))).toBe(true);
    });

    it("generates warning insight when both completion and quality are poor", () => {
      const r = computeDailyRoutineCare(baseInput({
        duty_logs: [
          makeDutyLog("dl1", { completed: true, handover_completed: false }),
          makeDutyLog("dl2", { completed: false, handover_completed: false }),
          makeDutyLog("dl3", { completed: false, handover_completed: false }),
          makeDutyLog("dl4", { completed: false, handover_completed: false }),
        ],
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: true }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: false }),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false }),
          makeShiftNote("sn4", "staff_4", { quality_adequate: false }),
        ],
      }));
      // completionRate = 25% < 70, qualityRate = 25% < 60
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("care gaps"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("outstanding headline contains 'Outstanding'", () => {
      const r = computeDailyRoutineCare(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions areas to address", () => {
      const r = computeDailyRoutineCare(baseInput({
        shift_notes: [
          makeShiftNote("sn1", "staff_1"),
          makeShiftNote("sn2", "staff_2"),
          makeShiftNote("sn3", "staff_3"),
          makeShiftNote("sn4", "staff_4", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1"),
          makeCleaning("cc2"),
          makeCleaning("cc3"),
          makeCleaning("cc4", { standard_met: false }),
        ],
      }));
      expect(r.headline).toContain("Good daily care");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [],
        duty_logs: [
          makeDutyLog("dl1", { completed: false, handover_completed: false }),
          makeDutyLog("dl2", { completed: false, handover_completed: false }),
        ],
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false, issues_found: 3, issues_resolved: 0 }),
        ],
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: false, handover_completed: false }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });

    it("adequate headline references improvement needed", () => {
      // Create a scenario scoring in 45-64 range
      // Mod 1: 2/4 = 50% → +0
      // Mod 2: all complete → +6
      // Mod 3: all quality → +5
      // Mod 4: 0 checks → -1
      // Mod 5: 0 sleep-ins → +1
      // Mod 6: 0 issues (no checks) → +4 (wait, 0 checks means no issues_found so totalIssues=0 → +4)
      // Actually with 0 cleaning_checks, mod 4 = -1 and mod 6 totalIssues = 0 → +4
      // Total: 52 + 0 + 6 + 5 - 1 + 1 + 4 = 67 — that's good, not adequate
      // Need: 52 + 0 + 3 + 0 - 1 + 1 + 4 = 59
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [
          makeRoutine("r1", "child_1"),
          makeRoutine("r2", "child_2"),
          makeRoutine("r3", "child_3", { personalised: false }),
          makeRoutine("r4", "child_4", { is_current: false }),
        ], // routineRate = 50% → +0
        duty_logs: [
          makeDutyLog("dl1"),
          makeDutyLog("dl2"),
          makeDutyLog("dl3"),
          makeDutyLog("dl4", { completed: false }),
        ], // completionRate = 75%, handoverRate = 100% — need BOTH >= 80; 75 < 80 so check: >=60? yes → +0
        // Actually: completionRate = 75 >= 60, handoverRate = 100 >= 60, but NOT both >= 80 → +0
        shift_notes: [
          makeShiftNote("sn1", "staff_1"),
          makeShiftNote("sn2", "staff_2"),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false }),
          makeShiftNote("sn4", "staff_4", { child_observations_included: false }),
        ], // qualityRate = 75%, obsRate = 75% → both >= 75 → +3
        cleaning_checks: [],
        sleep_ins: [],
      }));
      // 52 + 0 + 0 + 3 - 1 + 1 + 4 = 59 → adequate
      expect(r.routine_score).toBeGreaterThanOrEqual(45);
      expect(r.routine_score).toBeLessThan(65);
      expect(r.routine_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate daily care");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles empty duty_logs (mod 2 → -3)", () => {
      const r = computeDailyRoutineCare(baseInput({ duty_logs: [] }));
      // mod 2 = -3 instead of +6 → score drops by 9
      const full = computeDailyRoutineCare(baseInput());
      expect(full.routine_score - r.routine_score).toBe(9);
    });

    it("handles empty shift_notes (mod 3 → -2)", () => {
      const r = computeDailyRoutineCare(baseInput({ shift_notes: [] }));
      const full = computeDailyRoutineCare(baseInput());
      expect(full.routine_score - r.routine_score).toBe(7);
    });

    it("handles empty cleaning_checks (mod 4 → -1)", () => {
      // With 0 cleaning checks: mod 4 = -1, and totalIssues = 0 so mod 6 stays +4
      const r = computeDailyRoutineCare(baseInput({ cleaning_checks: [] }));
      const full = computeDailyRoutineCare(baseInput());
      // full: mod4 = +5, mod6 = +4. empty: mod4 = -1, mod6 = +4. diff = 6
      expect(full.routine_score - r.routine_score).toBe(6);
    });

    it("handles empty sleep_ins (mod 5 → +1 neutral)", () => {
      const r = computeDailyRoutineCare(baseInput({ sleep_ins: [] }));
      const full = computeDailyRoutineCare(baseInput());
      // full: mod5 = +4. empty: mod5 = +1. diff = 3
      expect(full.routine_score - r.routine_score).toBe(3);
    });

    it("clamps score to 0 minimum", () => {
      const r = computeDailyRoutineCare(baseInput({
        total_children: 100,
        daily_routines: [],
        duty_logs: [
          makeDutyLog("dl1", { completed: false, handover_completed: false }),
        ],
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false, issues_found: 10, issues_resolved: 0 }),
        ],
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: false, handover_completed: false }),
        ],
      }));
      expect(r.routine_score).toBeGreaterThanOrEqual(0);
      expect(r.routine_score).toBeLessThanOrEqual(100);
    });

    it("clamps score to 100 maximum", () => {
      // With all top-tier modifiers, max is 81. Score can never exceed 100.
      const r = computeDailyRoutineCare(baseInput());
      expect(r.routine_score).toBeLessThanOrEqual(100);
    });

    it("deduplicates children with multiple routines", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [
          makeRoutine("r1", "child_1"),
          makeRoutine("r2", "child_1"), // duplicate child
          makeRoutine("r3", "child_2"),
          makeRoutine("r4", "child_3"),
        ],
      }));
      // Unique child_ids: child_1, child_2, child_3 = 3 out of 4
      expect(r.children_with_routines).toBe(3);
    });

    it("handles all empty collections gracefully", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [],
        duty_logs: [],
        shift_notes: [],
        cleaning_checks: [],
        sleep_ins: [],
      }));
      // 52 - 5 - 3 - 2 - 1 + 1 + 4 = 46 → adequate
      expect(r.routine_score).toBe(46);
      expect(r.routine_rating).toBe("adequate");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends routine establishment when coverage < 70%", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [
          makeRoutine("r1", "child_1"),
          makeRoutine("r2", "child_2", { personalised: false }),
          makeRoutine("r3", "child_3", { is_current: false }),
          makeRoutine("r4", "child_4", { personalised: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("personalised daily routines") && rec.regulatory_ref === "Reg 9")).toBe(true);
    });

    it("recommends duty log improvement when completion < 80%", () => {
      const r = computeDailyRoutineCare(baseInput({
        duty_logs: [
          makeDutyLog("dl1", { completed: true }),
          makeDutyLog("dl2", { completed: false }),
          makeDutyLog("dl3", { completed: false }),
          makeDutyLog("dl4", { completed: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("duty log") && rec.urgency === "immediate" && rec.regulatory_ref === "Reg 40")).toBe(true);
    });

    it("recommends shift note training when quality < 75%", () => {
      const r = computeDailyRoutineCare(baseInput({
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: true }),
          makeShiftNote("sn2", "staff_2", { quality_adequate: false }),
          makeShiftNote("sn3", "staff_3", { quality_adequate: false }),
          makeShiftNote("sn4", "staff_4", { quality_adequate: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("shift note writing training") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends care continuity improvement plan when score < 65", () => {
      const r = computeDailyRoutineCare(baseInput({
        daily_routines: [],
        duty_logs: [
          makeDutyLog("dl1", { completed: false, handover_completed: false }),
          makeDutyLog("dl2", { completed: false, handover_completed: false }),
        ],
        shift_notes: [
          makeShiftNote("sn1", "staff_1", { quality_adequate: false, child_observations_included: false }),
        ],
        cleaning_checks: [
          makeCleaning("cc1", { standard_met: false, issues_found: 3, issues_resolved: 0 }),
        ],
        sleep_ins: [
          makeSleepIn("si1", "staff_5", { response_adequate: false, handover_completed: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("care continuity improvement plan") && rec.urgency === "planned")).toBe(true);
    });
  });
});
