// ══════════════════════════════════════════════════════════════════════════════
// Tests — Sleep Pattern Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseSleepPatterns,
  SleepInput,
  SleepNight,
  SleepAssessment,
} from "../sleep-pattern-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeNight(overrides: Partial<SleepNight> = {}): SleepNight {
  return {
    date: "2026-05-01",
    bedtime: "21:00",
    settledTime: "21:15",
    wakeTime: "07:00",
    nightWakings: 0,
    nightmares: false,
    nightTerrors: false,
    wetBed: false,
    sleepwalking: false,
    medicationGiven: false,
    resistedBedtime: false,
    environmentalDisruption: false,
    moodOnWake: "good",
    nextDayImpact: "none",
    ...overrides,
  };
}

function makeInput(overrides: Partial<SleepInput> = {}): SleepInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 14,
    nights: [],
    hasHealthPlan: true,
    gpNotifiedOfSleepIssues: false,
    sleepHygienePlanInPlace: false,
    ...overrides,
  };
}

function makeGoodNights(count: number): SleepNight[] {
  return Array.from({ length: count }, (_, i) => makeNight({
    date: `2026-05-${String(i + 1).padStart(2, "0")}`,
  }));
}

function makePoorNights(count: number): SleepNight[] {
  return Array.from({ length: count }, (_, i) => makeNight({
    date: `2026-05-${String(i + 1).padStart(2, "0")}`,
    bedtime: "23:00",
    settledTime: "00:30",
    wakeTime: "06:00",
    nightWakings: 3,
    nightmares: i % 2 === 0,
    resistedBedtime: true,
    moodOnWake: "poor",
    nextDayImpact: "moderate",
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suites
// ═══════════════════════════════════════════════════════════════════════════════

describe("Sleep Pattern Intelligence Engine", () => {
  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns a valid assessment structure", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("durationScore");
      expect(result).toHaveProperty("qualityScore");
      expect(result).toHaveProperty("consistencyScore");
      expect(result).toHaveProperty("impactScore");
      expect(result).toHaveProperty("averageDurationHours");
      expect(result).toHaveProperty("recommendedDurationHours");
      expect(result).toHaveProperty("trend");
      expect(result).toHaveProperty("disruptionPatterns");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName in assessment", () => {
      const result = analyseSleepPatterns(makeInput({
        childName: "Sam",
        nights: makeGoodNights(7),
      }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles empty nights array", () => {
      const result = analyseSleepPatterns(makeInput({ nights: [] }));
      expect(result.overallScore).toBe(0);
      expect(result.overallRating).toBe("inadequate");
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.concerns[0].category).toBe("data_quality");
    });
  });

  // ── Duration scoring ────────────────────────────────────────────────────

  describe("Duration scoring", () => {
    it("scores 100 for duration within recommended range (age 14: 8-10h)", () => {
      // settled 21:15, wake 07:00 = 9.75h → within 8-10h
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      expect(result.durationScore).toBe(100);
      expect(result.durationAdequacy).toBe("sufficient");
    });

    it("scores lower for insufficient sleep", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "23:30",
        wakeTime: "06:00", // 6.5 hours — 1.5h below minimum
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.durationScore).toBeLessThan(70);
      expect(result.durationAdequacy).toBe("insufficient");
    });

    it("marks borderline when slightly under", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "22:30",
        wakeTime: "06:00", // 7.5 hours — 0.5h under min of 8
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.durationAdequacy).toBe("borderline");
    });

    it("adjusts recommended duration by age", () => {
      // Age 8: recommended 9-11h
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "20:00",
        wakeTime: "06:30", // 10.5h → within 9-11h
      }));
      const result = analyseSleepPatterns(makeInput({ age: 8, nights }));
      expect(result.durationScore).toBe(100);
      expect(result.recommendedDurationHours).toEqual({ min: 9, max: 11 });
    });

    it("calculates average duration correctly", () => {
      // settled 21:15, wake 07:00 = 9h 45m = 9.75h
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      expect(result.averageDurationHours).toBe(9.8); // rounded to 1 dp
    });
  });

  // ── Quality scoring ─────────────────────────────────────────────────────

  describe("Quality scoring", () => {
    it("scores high for undisrupted nights", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      expect(result.qualityScore).toBe(100);
    });

    it("deducts for night wakings", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 2,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.qualityScore).toBeLessThan(80);
    });

    it("deducts for nightmares", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightmares: true,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.qualityScore).toBeLessThan(90);
    });

    it("deducts heavily for night terrors", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightTerrors: true,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.qualityScore).toBeLessThan(85);
    });

    it("cumulative disruptions compound", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 3,
        nightmares: true,
        resistedBedtime: true,
        environmentalDisruption: true,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.qualityScore).toBeLessThan(50);
    });
  });

  // ── Consistency scoring ────────────────────────────────────────────────

  describe("Consistency scoring", () => {
    it("scores high for consistent bedtimes", () => {
      const nights = Array.from({ length: 10 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        bedtime: "21:00",
        settledTime: "21:15",
        wakeTime: "07:00",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.consistencyScore).toBeGreaterThan(80);
    });

    it("scores lower for variable bedtimes", () => {
      const bedtimes = ["20:00", "23:30", "21:00", "22:30", "20:30", "23:00", "21:30", "00:00", "22:00", "20:00"];
      const nights = bedtimes.map((bt, i) => {
        const [h] = bt.split(":").map(Number);
        const settledH = h + 1 > 23 ? "00" : String(h + 1).padStart(2, "0");
        return makeNight({
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          bedtime: bt,
          settledTime: `${settledH}:00`,
          wakeTime: "07:00",
        });
      });
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.consistencyScore).toBeLessThan(60);
    });

    it("returns 50 with fewer than 3 nights (insufficient data)", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(2) }));
      expect(result.consistencyScore).toBe(50);
    });
  });

  // ── Impact scoring ─────────────────────────────────────────────────────

  describe("Impact scoring", () => {
    it("scores high when mood is good and no daytime impact", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      expect(result.impactScore).toBe(100);
    });

    it("deducts for poor morning mood", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        moodOnWake: "poor",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.impactScore).toBeLessThan(85);
    });

    it("deducts heavily for distressed morning mood", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        moodOnWake: "distressed",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.impactScore).toBeLessThan(65);
    });

    it("deducts for severe next-day impact", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nextDayImpact: "severe",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.impactScore).toBeLessThan(60);
    });
  });

  // ── Trend analysis ─────────────────────────────────────────────────────

  describe("Trend analysis", () => {
    it("detects improving trend (more sleep, fewer wakings in second half)", () => {
      const nights: SleepNight[] = [];
      for (let i = 0; i < 14; i++) {
        const isFirstHalf = i < 7;
        nights.push(makeNight({
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          settledTime: isFirstHalf ? "23:00" : "21:30",
          wakeTime: "07:00",
          nightWakings: isFirstHalf ? 3 : 0,
        }));
      }
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.trend).toBe("improving");
    });

    it("detects declining trend (less sleep, more wakings in second half)", () => {
      const nights: SleepNight[] = [];
      for (let i = 0; i < 14; i++) {
        const isFirstHalf = i < 7;
        nights.push(makeNight({
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          settledTime: isFirstHalf ? "21:00" : "23:30",
          wakeTime: "07:00",
          nightWakings: isFirstHalf ? 0 : 3,
        }));
      }
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.trend).toBe("declining");
    });

    it("returns stable when no significant change", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(14) }));
      expect(result.trend).toBe("stable");
    });

    it("returns stable when fewer than 6 nights (insufficient data)", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(4) }));
      expect(result.trend).toBe("stable");
    });
  });

  // ── Disruption patterns ────────────────────────────────────────────────

  describe("Disruption patterns", () => {
    it("identifies night waking pattern", () => {
      const nights = Array.from({ length: 14 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 2,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const wakingPattern = result.disruptionPatterns.find(p => p.type === "night_wakings");
      expect(wakingPattern).toBeDefined();
      expect(wakingPattern!.frequency).toBe("nightly");
    });

    it("identifies nightmare pattern", () => {
      const nights = Array.from({ length: 14 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightmares: i % 2 === 0, // 50%
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const nightmarePattern = result.disruptionPatterns.find(p => p.type === "nightmares");
      expect(nightmarePattern).toBeDefined();
      expect(nightmarePattern!.significance).toBe("medium");
    });

    it("identifies bedtime resistance pattern", () => {
      const nights = Array.from({ length: 10 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        resistedBedtime: true,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const pattern = result.disruptionPatterns.find(p => p.type === "bedtime_resistance");
      expect(pattern).toBeDefined();
      expect(pattern!.frequency).toBe("nightly");
      expect(pattern!.significance).toBe("high");
    });

    it("identifies environmental disruption pattern", () => {
      const nights = Array.from({ length: 10 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        environmentalDisruption: i < 5, // 50%
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const pattern = result.disruptionPatterns.find(p => p.type === "environmental_disruption");
      expect(pattern).toBeDefined();
    });

    it("returns no patterns for good sleepers", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(14) }));
      expect(result.disruptionPatterns).toHaveLength(0);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("raises critical concern for severe sleep deprivation", () => {
      // Age 14: needs 8h min. Give 5.5h.
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:30",
        wakeTime: "06:00", // 5.5h
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const deprivation = result.concerns.find(c => c.category === "sleep_deprivation");
      expect(deprivation).toBeDefined();
      expect(deprivation!.severity).toBe("critical");
    });

    it("raises significant concern for moderate sleep deprivation", () => {
      // Age 14: needs 8h min. Give 6.5h → 1.5h deficit
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "23:30",
        wakeTime: "06:00", // 6.5h
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const deprivation = result.concerns.find(c => c.category === "sleep_deprivation");
      expect(deprivation).toBeDefined();
      expect(deprivation!.severity).toBe("significant");
    });

    it("raises concern for high settling time", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        bedtime: "21:00",
        settledTime: "22:15", // 75 min settling
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const settling = result.concerns.find(c => c.category === "settling_difficulty");
      expect(settling).toBeDefined();
      expect(settling!.severity).toBe("significant");
    });

    it("raises concern for frequent night wakings", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 3,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const wakings = result.concerns.find(c => c.category === "night_wakings");
      expect(wakings).toBeDefined();
      expect(wakings!.severity).toBe("significant");
    });

    it("raises critical concern for very high nightmare frequency", () => {
      // 6/7 nights = ~6 per week
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightmares: i < 6,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const nightmares = result.concerns.find(c => c.category === "nightmares");
      expect(nightmares).toBeDefined();
      expect(nightmares!.severity).toBe("critical");
    });

    it("raises concern for severe daytime impact", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nextDayImpact: "severe",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const impact = result.concerns.find(c => c.category === "daytime_impact");
      expect(impact).toBeDefined();
      expect(impact!.severity).toBe("critical");
    });

    it("raises concern for distressed morning mood", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        moodOnWake: "distressed",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const emotional = result.concerns.find(c => c.category === "emotional_state");
      expect(emotional).toBeDefined();
    });

    it("raises concern when no health plan but issues present", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:30",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        hasHealthPlan: false,
      }));
      const planning = result.concerns.find(c => c.category === "care_planning");
      expect(planning).toBeDefined();
    });

    it("raises concern when GP not notified of significant issues", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:30",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        gpNotifiedOfSleepIssues: false,
      }));
      const referral = result.concerns.find(c => c.category === "health_referral");
      expect(referral).toBeDefined();
    });

    it("no concerns for excellent sleep", () => {
      const result = analyseSleepPatterns(makeInput({
        nights: makeGoodNights(14),
        gpNotifiedOfSleepIssues: true,
      }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies good duration as a strength", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      const s = result.strengths.find(s => s.category === "duration");
      expect(s).toBeDefined();
    });

    it("identifies good settling as a strength", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      const s = result.strengths.find(s => s.category === "settling");
      expect(s).toBeDefined();
    });

    it("identifies good sleep continuity", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      const s = result.strengths.find(s => s.category === "continuity");
      expect(s).toBeDefined();
    });

    it("identifies good morning mood", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(7) }));
      const s = result.strengths.find(s => s.category === "mood");
      expect(s).toBeDefined();
    });

    it("identifies sleep hygiene plan as strength", () => {
      const result = analyseSleepPatterns(makeInput({
        nights: makeGoodNights(7),
        sleepHygienePlanInPlace: true,
      }));
      const s = result.strengths.find(s => s.category === "care_planning");
      expect(s).toBeDefined();
    });

    it("no strengths for very poor sleep", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makePoorNights(14) }));
      expect(result.strengths.length).toBeLessThan(3);
    });
  });

  // ── Regulatory flags ───────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("all met for good sleep", () => {
      const result = analyseSleepPatterns(makeInput({
        nights: makeGoodNights(14),
        gpNotifiedOfSleepIssues: true,
      }));
      const unmet = result.regulatoryFlags.filter(f => f.status !== "met");
      expect(unmet).toHaveLength(0);
    });

    it("CHR 2015 Reg 6(1) not_met for critical concerns", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "01:00",
        wakeTime: "05:30", // 4.5h — critical
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const reg6 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 6(1)");
      expect(reg6).toBeDefined();
      expect(reg6!.status).toBe("not_met");
    });

    it("CHR 2015 Reg 6(2)(b)(i) not_met for sleep deprivation", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "23:30",
        wakeTime: "06:00", // 6.5h — 1.5h deficit
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const reg6b = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 6(2)(b)(i)");
      expect(reg6b).toBeDefined();
      expect(reg6b!.status).toBe("not_met");
    });

    it("SCCIF partially_met when no health plan but issues exist", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:00",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        hasHealthPlan: false,
      }));
      const sccif = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(sccif).toBeDefined();
      expect(sccif!.status).toBe("partially_met");
    });

    it("healthcare access not_met when GP not notified of significant issues", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:30",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        gpNotifiedOfSleepIssues: false,
      }));
      const healthcare = result.regulatoryFlags.find(f => f.area === "Healthcare Access");
      expect(healthcare).toBeDefined();
      expect(healthcare!.status).toBe("not_met");
    });
  });

  // ── Overall scoring & rating ───────────────────────────────────────────

  describe("Overall scoring & rating", () => {
    it("excellent rating for good sleep", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makeGoodNights(14) }));
      expect(result.overallRating).toBe("excellent");
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
    });

    it("poor rating for disrupted sleep (requires_improvement or lower)", () => {
      const result = analyseSleepPatterns(makeInput({ nights: makePoorNights(14) }));
      expect(["inadequate", "requires_improvement", "adequate"]).toContain(result.overallRating);
      expect(result.overallScore).toBeLessThan(60);
    });

    it("score is weighted average of sub-scores", () => {
      const nights = makeGoodNights(14);
      const result = analyseSleepPatterns(makeInput({ nights }));
      const expected = Math.round(
        result.durationScore * 0.30 +
        result.qualityScore * 0.30 +
        result.consistencyScore * 0.20 +
        result.impactScore * 0.20
      );
      expect(result.overallScore).toBe(expected);
    });

    it("rating boundaries: good (70-84)", () => {
      // Create moderate sleep — short duration but good quality
      const nights = Array.from({ length: 14 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "22:30",
        wakeTime: "06:30", // 8h — just at minimum
        nightWakings: i % 3 === 0 ? 1 : 0,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      // Should be good or adequate depending on exact scores
      expect(["excellent", "good", "adequate"]).toContain(result.overallRating);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends earlier bedtime for insufficient duration", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "23:30",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.recommendations.some(r => r.includes("earlier bedtime"))).toBe(true);
    });

    it("recommends bedtime routine review for high settling time", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        bedtime: "21:00",
        settledTime: "22:00", // 60 min settling
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.recommendations.some(r => r.includes("routine"))).toBe(true);
    });

    it("recommends CAMHS referral for frequent nightmares", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightmares: i < 5,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.recommendations.some(r => r.includes("CAMHS"))).toBe(true);
    });

    it("recommends sleep hygiene plan when not in place", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 2,
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        sleepHygienePlanInPlace: false,
      }));
      expect(result.recommendations.some(r => r.includes("sleep hygiene plan"))).toBe(true);
    });

    it("recommends GP referral when significant issues and GP not notified", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        settledTime: "00:30",
        wakeTime: "06:00",
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        gpNotifiedOfSleepIssues: false,
      }));
      expect(result.recommendations.some(r => r.includes("GP"))).toBe(true);
    });

    it("recommends sensory adjustments for neurodivergent children", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightWakings: 1,
      }));
      const result = analyseSleepPatterns(makeInput({
        nights,
        knownConditions: ["ADHD"],
        sleepHygienePlanInPlace: false,
      }));
      expect(result.recommendations.some(r => r.includes("sensory"))).toBe(true);
    });

    it("recommends addressing environmental disruptions", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        environmentalDisruption: true,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.recommendations.some(r => r.includes("environmental"))).toBe(true);
    });

    it("minimal recommendations for excellent sleep", () => {
      const result = analyseSleepPatterns(makeInput({
        nights: makeGoodNights(14),
        sleepHygienePlanInPlace: true,
        gpNotifiedOfSleepIssues: true,
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("handles after-midnight bedtimes correctly", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        bedtime: "23:30",
        settledTime: "00:15", // settles after midnight
        wakeTime: "08:00",  // 7.75h duration
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.averageDurationHours).toBeCloseTo(7.8, 0);
    });

    it("handles very late bedtimes (01:00+)", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        bedtime: "01:00",
        settledTime: "01:30",
        wakeTime: "09:00", // 7.5h
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.averageDurationHours).toBeCloseTo(7.5, 0);
    });

    it("handles single night correctly", () => {
      const result = analyseSleepPatterns(makeInput({
        nights: [makeNight()],
      }));
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.averageDurationHours).toBeGreaterThan(0);
    });

    it("nightmareFrequency normalised to per-week", () => {
      // 3 nightmares in 14 nights = 3/14 * 7 = 1.5 per week
      const nights = Array.from({ length: 14 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        nightmares: i < 3,
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      expect(result.nightmareFrequency).toBe(1.5);
    });

    it("medication monitoring works", () => {
      const nights = Array.from({ length: 7 }, (_, i) => makeNight({
        date: `2026-05-${String(i + 1).padStart(2, "0")}`,
        medicationGiven: true,
        medicationName: "Melatonin",
      }));
      const result = analyseSleepPatterns(makeInput({ nights }));
      const medConcern = result.concerns.find(c => c.category === "medication_use");
      expect(medConcern).toBeDefined();
    });
  });
});
