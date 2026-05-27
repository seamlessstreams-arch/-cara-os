import { describe, it, expect } from "vitest";
import {
  computeHomeNightCareSafety,
  type HomeNightCareSafetyInput,
  type NightCheckInput,
  type NightStaffHandoverInput,
  type NightAnxietySupportInput,
  type BedtimeRoutineInput,
  type WakeUpRoutineInput,
} from "../home-night-care-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeNC(overrides: Partial<NightCheckInput> = {}): NightCheckInput {
  return {
    id: "nc1", date: "2025-06-10", time: "02:00",
    child_id: "c1", staff_id: "s1",
    sleep_status: "sleeping", check_type: "scheduled",
    concern_raised: false, room_temp_ok: true,
    ...overrides,
  };
}

function makeHO(overrides: Partial<NightStaffHandoverInput> = {}): NightStaffHandoverInput {
  return {
    id: "ho1", date: "2025-06-10",
    risk_briefing_count: 3, specific_concerns_count: 2,
    children_at_home_count: 5, morning_handover_complete: true,
    ...overrides,
  };
}

function makeNAS(overrides: Partial<NightAnxietySupportInput> = {}): NightAnxietySupportInput {
  return {
    id: "nas1", child_id: "c1", record_date: "2025-05-01",
    anxiety_level: "settled", do_strategies_count: 4,
    do_not_strategies_count: 3, child_voice: "I feel safer with my nightlight on.",
    child_preferences: "Likes door ajar with hallway light on.",
    external_referral_active: null, review_date: "2025-09-01",
    ...overrides,
  };
}

function makeBR(overrides: Partial<BedtimeRoutineInput> = {}): BedtimeRoutineInput {
  return {
    id: "br1", child_id: "c1",
    effectiveness_rating: 4.5, child_agreed: true,
    routine_steps_count: 5, pre_bed_rituals_count: 3,
    reviewed_date: "2025-05-01",
    ...overrides,
  };
}

function makeWU(overrides: Partial<WakeUpRoutineInput> = {}): WakeUpRoutineInput {
  return {
    id: "wu1", child_id: "c1",
    effectivenessRating: 4.5, childAgreed: true,
    wakeUpSteps_count: 5, reviewedDate: "2025-05-01",
    ...overrides,
  };
}

/**
 * baseInput produces score = 80 (outstanding)
 * 52 base + 5 (mod1) + 4 (mod2) + 3 (mod3) + 4 (mod4) + 3 (mod5) + 3 (mod6) + 3 (mod7) + 3 (mod8) = 80
 *
 * Mod 1 (+5): 125 checks / 5 children = 25/child (>=20→+2), 100% temp ok (>=95→+1),
 *   no concerns raised → +1, 20% additional (10-40% → +1) = +5
 * Mod 2 (+4): 100% completion (>=90→+2), avg risk briefing 3 (>=2→+1), avg concerns 2 (>=1→+1) = +4
 * Mod 3 (+3): 80% coverage (>=80→+1), avg strategies 7 (>=6→+1), no severe/crisis → +1 = +3
 * Mod 4 (+4): 80% coverage (>=80→+1), avg eff 4.5 (>=4→+1), 100% agreed (>=80→+1),
 *   avg steps 8 (>=6→+1) = +4
 * Mod 5 (+3): 80% coverage (>=80→+1), avg eff 4.5 (>=4→+1), 100% agreed + 5 steps (>=80 && >=4→+1) = +3
 * Mod 6 (+3): 100% sleeping = good rate 100% (>=85→+2), bad rate 0% (=0→+1) = +3
 * Mod 7 (+3): anxiety voice 100%, bedtime agreed 100%, wakeup agreed 100%, anxiety prefs 100% → avg 100 (>=90→+3) = +3
 * Mod 8 (+3): 0 overdue reviews → +3
 */
function baseInput(overrides: Partial<HomeNightCareSafetyInput> = {}): HomeNightCareSafetyInput {
  // Generate 125 night checks: 100 scheduled + 25 additional across 5 children
  const nightChecks: NightCheckInput[] = [];
  const childIds = ["c1", "c2", "c3", "c4", "c5"];
  for (let i = 0; i < 125; i++) {
    const childIdx = i % 5;
    nightChecks.push(makeNC({
      id: `nc${i}`,
      child_id: childIds[childIdx],
      date: `2025-06-${String((i % 15) + 1).padStart(2, "0")}`,
      check_type: i < 100 ? "scheduled" : "additional",
    }));
  }

  return {
    today: TODAY,
    night_checks: nightChecks,
    night_staff_handovers: [
      makeHO({ id: "ho1", date: "2025-06-10" }),
      makeHO({ id: "ho2", date: "2025-06-11" }),
      makeHO({ id: "ho3", date: "2025-06-12" }),
      makeHO({ id: "ho4", date: "2025-06-13" }),
      makeHO({ id: "ho5", date: "2025-06-14" }),
    ],
    night_anxiety_support_records: [
      makeNAS({ id: "nas1", child_id: "c1" }),
      makeNAS({ id: "nas2", child_id: "c2" }),
      makeNAS({ id: "nas3", child_id: "c3" }),
      makeNAS({ id: "nas4", child_id: "c4" }),
    ],
    bedtime_routines: [
      makeBR({ id: "br1", child_id: "c1" }),
      makeBR({ id: "br2", child_id: "c2" }),
      makeBR({ id: "br3", child_id: "c3" }),
      makeBR({ id: "br4", child_id: "c4" }),
    ],
    wake_up_routines: [
      makeWU({ id: "wu1", child_id: "c1" }),
      makeWU({ id: "wu2", child_id: "c2" }),
      makeWU({ id: "wu3", child_id: "c3" }),
      makeWU({ id: "wu4", child_id: "c4" }),
    ],
    total_children: 5,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHomeNightCareSafety", () => {
  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no data at all", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 0,
      });
      expect(r.night_care_rating).toBe("insufficient_data");
      expect(r.night_care_score).toBe(0);
    });

    it("returns empty arrays for insufficient data", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 0,
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero summaries for insufficient data", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 0,
      });
      expect(r.night_checks.total_checks_30d).toBe(0);
      expect(r.handovers.total_handovers).toBe(0);
      expect(r.anxiety_support.total_records).toBe(0);
      expect(r.bedtime_routines.total_routines).toBe(0);
      expect(r.wake_up_routines.total_routines).toBe(0);
    });

    it("does NOT return insufficient_data when total_children > 0", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 3,
      });
      expect(r.night_care_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating thresholds ──────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("baseInput scores exactly 80 (outstanding)", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.night_care_score).toBe(80);
      expect(r.night_care_rating).toBe("outstanding");
    });

    it("good range: 65–79", () => {
      // Remove anxiety support records (mod3 drops) and reduce bedtime coverage
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: [],
        bedtime_routines: [
          makeBR({ id: "br1", child_id: "c1" }),
        ],
      }));
      // mod3: no records, 5 children >=3 → -1
      // mod4: coverage 20% (<40 → -1), eff +1, agreed +1, steps +1 = +2 (was +4)
      // mod7: no anxiety voice sources, only bedtime and wakeup → avg 100 still → +3
      // But anxiety prefs source removed too
      expect(r.night_care_rating).toBe("good");
      expect(r.night_care_score).toBeGreaterThanOrEqual(65);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("adequate range: 45–64", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_checks: [
          makeNC({ id: "nc1", child_id: "c1", date: "2025-06-10" }),
          makeNC({ id: "nc2", child_id: "c2", date: "2025-06-11" }),
          makeNC({ id: "nc3", child_id: "c3", date: "2025-06-12" }),
        ],
        night_staff_handovers: [
          makeHO({ id: "ho1", morning_handover_complete: false, risk_briefing_count: 0, specific_concerns_count: 0 }),
        ],
        night_anxiety_support_records: [],
        bedtime_routines: [
          makeBR({ id: "br1", child_id: "c1", effectiveness_rating: 2, child_agreed: false, routine_steps_count: 1, pre_bed_rituals_count: 1 }),
        ],
        wake_up_routines: [],
      }));
      expect(r.night_care_rating).toBe("adequate");
      expect(r.night_care_score).toBeGreaterThanOrEqual(45);
      expect(r.night_care_score).toBeLessThan(65);
    });

    it("inadequate: below 45", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY,
        night_checks: [],
        night_staff_handovers: [],
        night_anxiety_support_records: [],
        bedtime_routines: [],
        wake_up_routines: [],
        total_children: 5,
      });
      expect(r.night_care_rating).toBe("inadequate");
      expect(r.night_care_score).toBeLessThan(45);
    });
  });

  // ── Mod 1: Night Check Completeness & Frequency (±5) ─────────────
  describe("mod1: night check completeness", () => {
    it("+5 with excellent frequency, temp, no concerns, good additional balance", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.night_checks.checks_per_child).toBe(25);
      expect(r.night_checks.room_temp_ok_rate).toBe(100);
      expect(r.night_checks.concern_raised_count).toBe(0);
    });

    it("penalises low checks per child", () => {
      const checks = [
        makeNC({ id: "nc1", child_id: "c1", date: "2025-06-10" }),
        makeNC({ id: "nc2", child_id: "c2", date: "2025-06-11" }),
      ];
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.night_checks.checks_per_child).toBeLessThan(10);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low room temp ok rate", () => {
      const checks = baseInput().night_checks.map((c, i) => ({
        ...c, room_temp_ok: i < 40,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.night_checks.room_temp_ok_rate).toBeLessThan(70);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("rewards concern follow-ups", () => {
      const checks = [
        ...baseInput().night_checks.slice(0, 100).map(c => ({ ...c })),
        ...Array.from({ length: 10 }, (_, i) =>
          makeNC({ id: `cf${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-10", concern_raised: true }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          makeNC({ id: `fu${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-11", check_type: "concern_follow_up" }),
        ),
      ];
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.night_checks.concern_follow_up_rate).toBe(100);
    });

    it("penalises no checks with 2+ children", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_checks: [] }));
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("excludes checks older than 30 days", () => {
      const old = makeNC({ id: "old1", date: "2025-01-01" });
      const r = computeHomeNightCareSafety(baseInput({
        night_checks: [...baseInput().night_checks, old],
      }));
      expect(r.night_checks.total_checks_30d).toBe(125);
    });

    it("penalises when no scheduled checks at all", () => {
      const checks = Array.from({ length: 100 }, (_, i) =>
        makeNC({ id: `nc${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-10", check_type: "additional" }),
      );
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      // additional_rate = 100% > 40% → no +1, scheduled 0 → -1
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 2: Handover Quality (±4) ──────────────────────────────────
  describe("mod2: handover quality", () => {
    it("+4 with full completion, good risk briefing, concerns documented", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.handovers.completion_rate).toBe(100);
      expect(r.handovers.avg_risk_briefing_count).toBe(3);
      expect(r.handovers.avg_concerns_documented).toBe(2);
    });

    it("penalises low completion rate", () => {
      const handovers = baseInput().night_staff_handovers.map(h => ({
        ...h, morning_handover_complete: false,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: handovers }));
      expect(r.handovers.completion_rate).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low risk briefing", () => {
      const handovers = baseInput().night_staff_handovers.map(h => ({
        ...h, risk_briefing_count: 0,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: handovers }));
      expect(r.handovers.avg_risk_briefing_count).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises no concerns documented", () => {
      const handovers = baseInput().night_staff_handovers.map(h => ({
        ...h, specific_concerns_count: 0,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: handovers }));
      expect(r.handovers.avg_concerns_documented).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises no handovers with 2+ children", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: [] }));
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 3: Night Anxiety Support Coverage (±3) ────────────────────
  describe("mod3: night anxiety support", () => {
    it("+3 with good coverage, strategies, no severe/crisis", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.anxiety_support.child_coverage).toBe(80);
      expect(r.anxiety_support.avg_strategies).toBe(7);
    });

    it("penalises low coverage", () => {
      const records = [makeNAS({ id: "nas1", child_id: "c1" })];
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.anxiety_support.child_coverage).toBe(20);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low strategy count", () => {
      const records = baseInput().night_anxiety_support_records.map(r => ({
        ...r, do_strategies_count: 1, do_not_strategies_count: 0,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.anxiety_support.avg_strategies).toBeLessThan(3);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises severe/crisis without referral", () => {
      const records = [
        makeNAS({ id: "nas1", child_id: "c1", anxiety_level: "severe", external_referral_active: null }),
        makeNAS({ id: "nas2", child_id: "c2", anxiety_level: "crisis", external_referral_active: "" }),
        makeNAS({ id: "nas3", child_id: "c3", anxiety_level: "severe", external_referral_active: null }),
        makeNAS({ id: "nas4", child_id: "c4", anxiety_level: "settled" }),
      ];
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.anxiety_support.severe_crisis_with_referral_rate).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("rewards severe/crisis with referral", () => {
      const records = [
        makeNAS({ id: "nas1", child_id: "c1", anxiety_level: "severe", external_referral_active: "CAMHS" }),
        makeNAS({ id: "nas2", child_id: "c2", anxiety_level: "crisis", external_referral_active: "Therapist" }),
        makeNAS({ id: "nas3", child_id: "c3" }),
        makeNAS({ id: "nas4", child_id: "c4" }),
      ];
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.anxiety_support.severe_crisis_with_referral_rate).toBe(100);
    });

    it("penalises no records with 3+ children", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: [] }));
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 4: Bedtime Routine Coverage & Quality (±4) ────────────────
  describe("mod4: bedtime routines", () => {
    it("+4 with good coverage, effectiveness, agreement, richness", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.bedtime_routines.child_coverage).toBe(80);
      expect(r.bedtime_routines.avg_effectiveness).toBe(4.5);
      expect(r.bedtime_routines.child_agreed_rate).toBe(100);
      expect(r.bedtime_routines.avg_steps).toBe(8);
    });

    it("penalises low coverage", () => {
      const routines = [makeBR({ id: "br1", child_id: "c1" })];
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: routines }));
      expect(r.bedtime_routines.child_coverage).toBe(20);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low effectiveness", () => {
      const routines = baseInput().bedtime_routines.map(br => ({
        ...br, effectiveness_rating: 2,
      }));
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: routines }));
      expect(r.bedtime_routines.avg_effectiveness).toBe(2);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low child agreement", () => {
      const routines = baseInput().bedtime_routines.map(br => ({
        ...br, child_agreed: false,
      }));
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: routines }));
      expect(r.bedtime_routines.child_agreed_rate).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low routine richness", () => {
      const routines = baseInput().bedtime_routines.map(br => ({
        ...br, routine_steps_count: 1, pre_bed_rituals_count: 0,
      }));
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: routines }));
      expect(r.bedtime_routines.avg_steps).toBeLessThan(3);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises no routines with 2+ children", () => {
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: [] }));
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 5: Wake-Up Routine Coverage & Quality (±3) ────────────────
  describe("mod5: wake-up routines", () => {
    it("+3 with good coverage, effectiveness, agreement & steps", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.wake_up_routines.child_coverage).toBe(80);
      expect(r.wake_up_routines.avg_effectiveness).toBe(4.5);
      expect(r.wake_up_routines.child_agreed_rate).toBe(100);
      expect(r.wake_up_routines.avg_steps).toBe(5);
    });

    it("penalises low coverage", () => {
      const routines = [makeWU({ id: "wu1", child_id: "c1" })];
      const r = computeHomeNightCareSafety(baseInput({ wake_up_routines: routines }));
      expect(r.wake_up_routines.child_coverage).toBe(20);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low effectiveness", () => {
      const routines = baseInput().wake_up_routines.map(wu => ({
        ...wu, effectivenessRating: 2,
      }));
      const r = computeHomeNightCareSafety(baseInput({ wake_up_routines: routines }));
      expect(r.wake_up_routines.avg_effectiveness).toBe(2);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises low agreement", () => {
      const routines = baseInput().wake_up_routines.map(wu => ({
        ...wu, childAgreed: false,
      }));
      const r = computeHomeNightCareSafety(baseInput({ wake_up_routines: routines }));
      expect(r.wake_up_routines.child_agreed_rate).toBe(0);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises no routines with 2+ children", () => {
      const r = computeHomeNightCareSafety(baseInput({ wake_up_routines: [] }));
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 6: Sleep Quality & Concern Management (±3) ────────────────
  describe("mod6: sleep quality", () => {
    it("+3 with high sleeping rate and no distress/absence", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.sleep_quality.sleeping_rate).toBe(100);
      expect(r.sleep_quality.distressed_rate).toBe(0);
      expect(r.sleep_quality.not_in_room_rate).toBe(0);
    });

    it("penalises high distressed rate", () => {
      const checks = baseInput().night_checks.map((c, i) => ({
        ...c, sleep_status: i < 40 ? "distressed" : "sleeping",
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.sleep_quality.distressed_rate).toBeGreaterThan(20);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises high not_in_room rate", () => {
      const checks = baseInput().night_checks.map((c, i) => ({
        ...c, sleep_status: i < 30 ? "not_in_room" : "sleeping",
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.sleep_quality.not_in_room_rate).toBeGreaterThan(10);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("handles mixed sleep statuses", () => {
      const checks = baseInput().night_checks.map((c, i) => ({
        ...c,
        sleep_status: i < 50 ? "sleeping" : i < 90 ? "awake_settled" : "awake_unsettled",
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      // sleeping(50) + settled(40) = 90/125 = 72% → goodRate >=65 → +1
      // badRate: 0 distressed + 0 not_in_room → +1
      // total mod6: +2 (was +3)
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Mod 7: Child Voice Across Night Care (±3) ─────────────────────
  describe("mod7: child voice", () => {
    it("+3 when voice rate is 90%+ across all domains", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.child_voice.anxiety_voice_rate).toBe(100);
      expect(r.child_voice.bedtime_agreed_rate).toBe(100);
      expect(r.child_voice.wakeup_agreed_rate).toBe(100);
      expect(r.child_voice.anxiety_preferences_rate).toBe(100);
    });

    it("penalises low voice across domains", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: baseInput().night_anxiety_support_records.map(r => ({
          ...r, child_voice: "", child_preferences: "",
        })),
        bedtime_routines: baseInput().bedtime_routines.map(r => ({
          ...r, child_agreed: false,
        })),
        wake_up_routines: baseInput().wake_up_routines.map(r => ({
          ...r, childAgreed: false,
        })),
      }));
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("mid-range voice gives +1 or +2", () => {
      // Mix of agreed and not agreed
      const r = computeHomeNightCareSafety(baseInput({
        bedtime_routines: [
          makeBR({ id: "br1", child_id: "c1", child_agreed: true }),
          makeBR({ id: "br2", child_id: "c2", child_agreed: true }),
          makeBR({ id: "br3", child_id: "c3", child_agreed: false }),
          makeBR({ id: "br4", child_id: "c4", child_agreed: false }),
        ],
        wake_up_routines: [
          makeWU({ id: "wu1", child_id: "c1", childAgreed: true }),
          makeWU({ id: "wu2", child_id: "c2", childAgreed: true }),
          makeWU({ id: "wu3", child_id: "c3", childAgreed: false }),
          makeWU({ id: "wu4", child_id: "c4", childAgreed: false }),
        ],
      }));
      // anxiety voice 100%, bedtime agreed 50%, wakeup agreed 50%, anxiety prefs 100% → avg 75% → +2
      expect(r.child_voice.bedtime_agreed_rate).toBe(50);
      expect(r.child_voice.wakeup_agreed_rate).toBe(50);
    });
  });

  // ── Mod 8: Review Compliance (±3) ─────────────────────────────────
  describe("mod8: review compliance", () => {
    it("+3 with no overdue reviews", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.review_compliance.total_overdue).toBe(0);
    });

    it("penalises overdue anxiety reviews", () => {
      const records = baseInput().night_anxiety_support_records.map(r => ({
        ...r, review_date: "2025-01-01",
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.review_compliance.anxiety_overdue).toBe(4);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises overdue bedtime reviews", () => {
      const routines = baseInput().bedtime_routines.map(br => ({
        ...br, reviewed_date: "2025-01-01",
      }));
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: routines }));
      expect(r.review_compliance.bedtime_overdue).toBe(4);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("penalises overdue wake-up reviews", () => {
      const routines = baseInput().wake_up_routines.map(wu => ({
        ...wu, reviewedDate: "2025-01-01",
      }));
      const r = computeHomeNightCareSafety(baseInput({ wake_up_routines: routines }));
      expect(r.review_compliance.wakeup_overdue).toBe(4);
      expect(r.night_care_score).toBeLessThan(80);
    });

    it("small number of overdue gives +1", () => {
      const records = baseInput().night_anxiety_support_records.map((r, i) => ({
        ...r, review_date: i < 1 ? "2025-01-01" : "2025-09-01",
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_anxiety_support_records: records }));
      expect(r.review_compliance.total_overdue).toBeLessThanOrEqual(2);
      // mod8 gives +1 instead of +3
      expect(r.night_care_score).toBeLessThan(80);
    });
  });

  // ── Profile calculations ──────────────────────────────────────────
  describe("profile calculations", () => {
    it("correctly calculates night check summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.night_checks.total_checks_30d).toBe(125);
      expect(r.night_checks.checks_per_child).toBe(25);
      expect(r.night_checks.room_temp_ok_rate).toBe(100);
      expect(r.night_checks.concern_raised_count).toBe(0);
      expect(r.night_checks.scheduled_count).toBe(100);
      expect(r.night_checks.additional_count).toBe(25);
      expect(r.night_checks.children_checked).toBe(5);
    });

    it("correctly calculates handover summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.handovers.total_handovers).toBe(5);
      expect(r.handovers.completion_rate).toBe(100);
      expect(r.handovers.avg_risk_briefing_count).toBe(3);
      expect(r.handovers.avg_concerns_documented).toBe(2);
    });

    it("correctly calculates anxiety support summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.anxiety_support.total_records).toBe(4);
      expect(r.anxiety_support.child_coverage).toBe(80);
      expect(r.anxiety_support.avg_strategies).toBe(7);
      expect(r.anxiety_support.child_voice_rate).toBe(100);
      expect(r.anxiety_support.child_preferences_rate).toBe(100);
    });

    it("correctly calculates bedtime routine summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.bedtime_routines.total_routines).toBe(4);
      expect(r.bedtime_routines.child_coverage).toBe(80);
      expect(r.bedtime_routines.avg_effectiveness).toBe(4.5);
      expect(r.bedtime_routines.child_agreed_rate).toBe(100);
      expect(r.bedtime_routines.avg_steps).toBe(8);
      expect(r.bedtime_routines.overdue_reviews).toBe(0);
    });

    it("correctly calculates wake-up routine summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.wake_up_routines.total_routines).toBe(4);
      expect(r.wake_up_routines.child_coverage).toBe(80);
      expect(r.wake_up_routines.avg_effectiveness).toBe(4.5);
      expect(r.wake_up_routines.child_agreed_rate).toBe(100);
      expect(r.wake_up_routines.avg_steps).toBe(5);
      expect(r.wake_up_routines.overdue_reviews).toBe(0);
    });

    it("correctly calculates sleep quality summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.sleep_quality.sleeping_rate).toBe(100);
      expect(r.sleep_quality.settled_rate).toBe(0);
      expect(r.sleep_quality.distressed_rate).toBe(0);
      expect(r.sleep_quality.not_in_room_rate).toBe(0);
    });

    it("correctly calculates review compliance summary", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.review_compliance.anxiety_overdue).toBe(0);
      expect(r.review_compliance.bedtime_overdue).toBe(0);
      expect(r.review_compliance.wakeup_overdue).toBe(0);
      expect(r.review_compliance.total_overdue).toBe(0);
    });
  });

  // ── Strengths & concerns ──────────────────────────────────────────
  describe("narrative", () => {
    it("generates strengths for outstanding baseInput", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("night check"))).toBe(true);
    });

    it("generates strength for good handover completion", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.strengths.some(s => s.includes("handover"))).toBe(true);
    });

    it("generates strength for bedtime routines", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.strengths.some(s => s.includes("bedtime") || s.includes("Bedtime"))).toBe(true);
    });

    it("generates concerns when no night checks", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_checks: [] }));
      expect(r.concerns.some(c => c.includes("night check") || c.includes("No night checks"))).toBe(true);
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
    });

    it("generates concerns for low temp compliance", () => {
      const checks = baseInput().night_checks.map((c, i) => ({
        ...c, room_temp_ok: i < 30,
      }));
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.concerns.some(c => c.includes("temperature"))).toBe(true);
    });

    it("generates concerns for no handovers", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: [] }));
      expect(r.concerns.some(c => c.includes("handover"))).toBe(true);
    });

    it("generates concerns for no bedtime routines", () => {
      const r = computeHomeNightCareSafety(baseInput({ bedtime_routines: [] }));
      expect(r.concerns.some(c => c.includes("bedtime") || c.includes("Bedtime"))).toBe(true);
    });

    it("generates recommendations with regulatory refs", () => {
      const r = computeHomeNightCareSafety(baseInput({ night_checks: [] }));
      const recsWithRef = r.recommendations.filter(rec => rec.regulatory_ref !== null);
      expect(recsWithRef.length).toBeGreaterThan(0);
    });

    it("no concerns for perfect baseInput", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("no recommendations for perfect baseInput", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────
  describe("ARIA insights", () => {
    it("flags high distressed rate", () => {
      const checks = Array.from({ length: 20 }, (_, i) =>
        makeNC({
          id: `nc${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-10",
          sleep_status: i < 5 ? "distressed" : "sleeping",
        }),
      );
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.insights.some(i => i.text.includes("distressed") && i.severity === "critical")).toBe(true);
    });

    it("flags high not-in-room rate", () => {
      const checks = Array.from({ length: 20 }, (_, i) =>
        makeNC({
          id: `nc${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-10",
          sleep_status: i < 3 ? "not_in_room" : "sleeping",
        }),
      );
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      expect(r.insights.some(i => i.text.includes("not in their rooms"))).toBe(true);
    });

    it("flags critically low handover completion", () => {
      const handovers = Array.from({ length: 6 }, (_, i) =>
        makeHO({ id: `ho${i}`, morning_handover_complete: false }),
      );
      const r = computeHomeNightCareSafety(baseInput({ night_staff_handovers: handovers }));
      expect(r.insights.some(i => i.text.includes("handover") && i.severity === "critical")).toBe(true);
    });

    it("positive insight for excellent sleep with no issues", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("sleeping well"))).toBe(true);
    });

    it("positive insight for strong child agreement on routines", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child agreement"))).toBe(true);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────
  describe("headline", () => {
    it("outstanding headline", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.headline).toContain("outstanding");
    });

    it("good headline", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: [],
        bedtime_routines: [makeBR({ id: "br1", child_id: "c1" })],
      }));
      expect(r.headline).toContain("Good");
    });

    it("inadequate headline", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 5,
      });
      expect(r.headline).toContain("gaps");
    });
  });

  // ── Cross-modifier interactions ────────────────────────────────────
  describe("cross-modifier interactions", () => {
    it("removing anxiety records affects mod3, mod7, and mod8", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: [],
      }));
      // mod3: no records, 5 children >=3 → -1 (was +3, delta -4)
      // mod7: loses anxiety voice + prefs sources → avg from bedtime+wakeup only = 100 → +3 (unchanged)
      // mod8: reviewable total drops, still 0 overdue → +3 (unchanged)
      // Net change: -4 from mod3
      expect(r.night_care_score).toBe(80 - 4);
    });

    it("removing bedtime routines affects mod4, mod7, and mod8", () => {
      const r = computeHomeNightCareSafety(baseInput({
        bedtime_routines: [],
      }));
      // mod4: no routines, 5 children >=2 → -2 (was +4, delta -6)
      // mod7: loses bedtime agreed source → avg from anxiety voice, wakeup agreed, anxiety prefs → 100 → +3 (unchanged)
      // mod8: reviewable total drops, still 0 overdue → +3 (unchanged)
      // Net change: -6 from mod4
      expect(r.night_care_score).toBe(80 - 6);
    });

    it("removing wake-up routines affects mod5, mod7, and mod8", () => {
      const r = computeHomeNightCareSafety(baseInput({
        wake_up_routines: [],
      }));
      // mod5: no routines, 5 children >=2 → -1 (was +3, delta -4)
      // mod7: loses wakeup agreed source → avg from anxiety voice, bedtime agreed, anxiety prefs → 100 → +3 (unchanged)
      // mod8: reviewable total drops, still 0 overdue → +3 (unchanged)
      // Net change: -4 from mod5
      expect(r.night_care_score).toBe(80 - 4);
    });

    it("multiple modifier degradation stacks correctly", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: [],
        bedtime_routines: [],
        wake_up_routines: [],
      }));
      // mod3: -1, mod4: -2, mod5: -1
      // mod7: no voice sources → 0
      // mod8: no reviewable → 0
      // deltas from base: mod3 (-4), mod4 (-6), mod5 (-4), mod7 (-3), mod8 (-3) = -20
      expect(r.night_care_score).toBe(80 - 20);
    });

    it("poor checks affect both mod1 and mod6", () => {
      const checks = Array.from({ length: 10 }, (_, i) =>
        makeNC({
          id: `nc${i}`, child_id: `c${(i % 5) + 1}`, date: "2025-06-10",
          sleep_status: "distressed", room_temp_ok: false,
        }),
      );
      const r = computeHomeNightCareSafety(baseInput({ night_checks: checks }));
      // mod1: 2/child (<10 → -1), temp 0% (<70 → -1), no concerns → +1, all scheduled (no additional, scheduled>0 → 0) → -1
      // mod6: goodRate 0% (<40 → -1), badRate 100% (>20 → -2) = -3
      expect(r.night_care_score).toBeLessThan(70);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single child home", () => {
      const checks = Array.from({ length: 25 }, (_, i) =>
        makeNC({ id: `nc${i}`, child_id: "c1", date: `2025-06-${String((i % 15) + 1).padStart(2, "0")}` }),
      );
      const r = computeHomeNightCareSafety({
        today: TODAY,
        night_checks: checks,
        night_staff_handovers: [makeHO({ children_at_home_count: 1 })],
        night_anxiety_support_records: [makeNAS({ child_id: "c1" })],
        bedtime_routines: [makeBR({ child_id: "c1" })],
        wake_up_routines: [makeWU({ child_id: "c1" })],
        total_children: 1,
      });
      expect(r.night_care_rating).not.toBe("insufficient_data");
      expect(r.bedtime_routines.child_coverage).toBe(100);
    });

    it("score never exceeds 100", () => {
      const r = computeHomeNightCareSafety(baseInput());
      expect(r.night_care_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: [], night_staff_handovers: [],
        night_anxiety_support_records: [], bedtime_routines: [],
        wake_up_routines: [], total_children: 10,
      });
      expect(r.night_care_score).toBeGreaterThanOrEqual(0);
    });

    it("handles duplicate child_ids in same collection", () => {
      const r = computeHomeNightCareSafety(baseInput({
        bedtime_routines: [
          makeBR({ id: "br1", child_id: "c1" }),
          makeBR({ id: "br2", child_id: "c1" }),
        ],
      }));
      expect(r.bedtime_routines.child_coverage).toBe(20);
    });

    it("future review dates are not overdue", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_anxiety_support_records: [makeNAS({ review_date: "2026-01-01" })],
      }));
      expect(r.review_compliance.anxiety_overdue).toBe(0);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeHomeNightCareSafety(baseInput({
        night_checks: [],
        night_staff_handovers: [],
        total_children: 1,
      }));
      expect(r.night_checks.room_temp_ok_rate).toBe(0);
      expect(r.handovers.completion_rate).toBe(0);
    });

    it("checks_per_child rounds to one decimal", () => {
      const checks = Array.from({ length: 7 }, (_, i) =>
        makeNC({ id: `nc${i}`, child_id: `c${(i % 3) + 1}`, date: "2025-06-10" }),
      );
      const r = computeHomeNightCareSafety({
        today: TODAY, night_checks: checks,
        night_staff_handovers: [], night_anxiety_support_records: [],
        bedtime_routines: [], wake_up_routines: [], total_children: 3,
      });
      // 7 / 3 = 2.333... → rounded to 2.3
      expect(r.night_checks.checks_per_child).toBe(2.3);
    });
  });
});
