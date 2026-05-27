import { describe, it, expect } from "vitest";
import {
  computeHolidayEnrichingExperiences,
  type HolidayRecordInput,
  type CareAnniversaryInput,
  type HolidayExperiencesInput,
} from "../home-holiday-enriching-experiences-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeHoliday(overrides: Partial<HolidayRecordInput> = {}): HolidayRecordInput {
  return {
    id: "hol_1", child_id: "yp_1", duration_days: 5,
    child_chose_destination: true, has_highlights: true,
    photos_taken: true, has_child_voice: true, challenges_count: 0,
    ...overrides,
  };
}

function makeAnniversary(overrides: Partial<CareAnniversaryInput> = {}): CareAnniversaryInput {
  return {
    id: "ann_1", child_id: "yp_1", anniversary_type: "birthday",
    child_attitude: "positive", has_upcoming_plan: true,
    support_in_place_count: 3, triggers_count: 0, has_child_voice: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HolidayExperiencesInput> = {}): HolidayExperiencesInput {
  // 4 children, 10 holidays (>=2 per child), 8 anniversaries all planned/positive/voiced
  // Expected: 52 +5(child choice) +6(photos) +5(voice) +5(anniv plan) +4(positive anniv) +5(holidays/child>=2) = 82
  return {
    today: "2026-05-27",
    total_children: 4,
    holidays: Array.from({ length: 10 }, (_, i) => makeHoliday({ id: `hol_${i}`, child_id: `yp_${i % 4}` })),
    anniversaries: Array.from({ length: 8 }, (_, i) => makeAnniversary({ id: `ann_${i}`, child_id: `yp_${i % 4}` })),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHolidayEnrichingExperiences", () => {

  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ total_children: 0 }));
      expect(r.experiences_rating).toBe("insufficient_data");
      expect(r.experiences_score).toBe(0);
    });

    it("returns empty arrays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns correct headline", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ total_children: 0 }));
      expect(r.headline).toBe("No children data available for experience analysis");
    });
  });

  describe("outstanding rating", () => {
    it("returns outstanding with score 82 for base input", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.experiences_score).toBe(82);
      expect(r.experiences_rating).toBe("outstanding");
    });

    it("has correct headline", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.headline).toContain("rich, child-led");
    });
  });

  describe("good rating", () => {
    it("achieves good when some modifiers are moderate", () => {
      // Drop photos to 70% → +2, drop anniv positive to 70% → +1
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, photos_taken: i < 7,
      }));
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, child_attitude: i < 7 ? "positive" : "anxious",
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      // 52+5+2+5+5+1+5 = 75
      expect(r.experiences_score).toBe(75);
      expect(r.experiences_rating).toBe("good");
    });

    it("has correct headline for good", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, photos_taken: i < 7,
      }));
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, child_attitude: i < 7 ? "positive" : "anxious",
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      expect(r.headline).toContain("Good range");
    });
  });

  describe("adequate rating", () => {
    it("achieves adequate with weaknesses", () => {
      // Choice 40% → -5, photos 40% → -5, voice rate across all items
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`,
        child_chose_destination: i < 4,
        photos_taken: i < 4,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 52 -5(choice 40%) -5(photos 40%) +5(voice: 10h+8a voiced / 18 = 100%) +5(anniv plan) +4(anniv positive) +5(holidays/child 2.5) = 61
      // Wait, voice: holidays have has_child_voice defaults. 10 holidays all have voice, 8 anniv all have voice = 18/18 = 100%
      // Actually the holidays we passed: the default has_child_voice is true (from makeHoliday default).
      // So voice is still 100%.
      // 52-5-5+5+5+4+5 = 61
      expect(r.experiences_score).toBe(61);
      expect(r.experiences_rating).toBe("adequate");
    });
  });

  describe("inadequate rating", () => {
    it("achieves inadequate with severe deficiencies", () => {
      const holidays = Array.from({ length: 2 }, (_, i) => makeHoliday({
        id: `h_${i}`,
        child_chose_destination: false,
        photos_taken: false,
        has_child_voice: false,
      }));
      const anniversaries = Array.from({ length: 8 }, (_, i) => makeAnniversary({
        id: `a_${i}`,
        has_upcoming_plan: false,
        child_attitude: "distressed",
        has_child_voice: false,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      // 52 -5(choice 0%) -5(photos 0%) -4(voice 0/10=0%) -5(anniv plan 0%) -4(positive 0%) -3(holidays/child 0.5<0.5? no, 2/4=0.5, not <0.5)
      // holidays/child = 0.5, that's not < 0.5, so... >=1? No, 0.5 < 1. So we check: >=2 no, >=1 no, <0.5? No (0.5 is not <0.5)
      // So the modifier 6 gives 0 (between 0.5 and 1, no bonus/penalty except totalHolidays===0)
      // 52-5-5-4-5-4+0 = 29
      expect(r.experiences_score).toBe(29);
      expect(r.experiences_rating).toBe("inadequate");
    });

    it("has correct headline for inadequate", () => {
      const holidays = Array.from({ length: 2 }, (_, i) => makeHoliday({
        id: `h_${i}`,
        child_chose_destination: false,
        photos_taken: false,
        has_child_voice: false,
      }));
      const anniversaries = Array.from({ length: 8 }, (_, i) => makeAnniversary({
        id: `a_${i}`,
        has_upcoming_plan: false,
        child_attitude: "distressed",
        has_child_voice: false,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      expect(r.experiences_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Modifier 1: Child choice ─────────────────────────────────────────
  describe("modifier: child choice", () => {
    it("+5 when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.child_choice_rate).toBe(100);
      expect(r.experiences_score).toBe(82);
    });

    it("+2 when 70-89%", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, child_chose_destination: i < 8,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 82-5+2 = 79
      expect(r.experiences_score).toBe(79);
    });

    it("-5 when < 50%", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, child_chose_destination: i < 4,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 82-5-5 = 72
      expect(r.experiences_score).toBe(72);
    });

    it("-2 when 0 holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [] }));
      // When 0 holidays: mod1=-2, mod2=0(no adj), mod3: voice items = 0+8=8 anniv still, voice still computed
      // voice: 8 anniv with voice = 8/8 = 100% → +5
      // mod4: anniv plan +5, mod5: positive +4, mod6: 0 holidays → -5
      // 52-2+0+5+5+4-5 = 59
      expect(r.experiences_score).toBe(59);
    });
  });

  // ── Modifier 2: Photos documented ────────────────────────────────────
  describe("modifier: photos documented", () => {
    it("+6 when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.photos_documented_rate).toBe(100);
    });

    it("+2 when 70-89%", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, photos_taken: i < 8,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 82-6+2 = 78
      expect(r.experiences_score).toBe(78);
    });

    it("-5 when < 50%", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, photos_taken: i < 4,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 82-6-5 = 71
      expect(r.experiences_score).toBe(71);
    });
  });

  // ── Modifier 3: Child voice ──────────────────────────────────────────
  describe("modifier: child voice", () => {
    it("+5 when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.child_voice_rate).toBe(100);
    });

    it("-4 when < 50%", () => {
      const holidays = Array.from({ length: 10 }, (_, i) => makeHoliday({
        id: `h_${i}`, has_child_voice: i < 4,
      }));
      const anniversaries = Array.from({ length: 8 }, (_, i) => makeAnniversary({
        id: `a_${i}`, has_child_voice: i < 3,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      // voice: (4+3)/(10+8) = 7/18 = 39% → -4
      // 82-5-4 = 73
      expect(r.experiences_score).toBe(73);
    });

    it("-1 when no voice items at all", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [], anniversaries: [] }));
      // mod1: 0 holidays → -2, mod2: 0 holidays → 0, mod3: 0 items → -1
      // mod4: 0 anniv → +1, mod5: 0 anniv → +2, mod6: 0 holidays → -5
      // 52-2+0-1+1+2-5 = 47
      expect(r.experiences_score).toBe(47);
    });
  });

  // ── Modifier 4: Anniversary planning ─────────────────────────────────
  describe("modifier: anniversary planning", () => {
    it("+5 when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.anniversaries_planned_rate).toBe(100);
    });

    it("+2 when 70-89%", () => {
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, has_upcoming_plan: i < 8,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries }));
      // 82-5+2-4+... Actually need to recompute. Base anniv metrics change.
      // With 10 anniv, 8 planned: 80% → +2. Also positive still 100% → +4 still.
      // Voice: 10h + 10a = 20 items, all voiced = 100% → +5 still.
      // 52+5+6+5+2+4+5 = 79
      expect(r.experiences_score).toBe(79);
    });

    it("-5 when < 50%", () => {
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, has_upcoming_plan: i < 3,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries }));
      // 30% planned → -5. 52+5+6+5-5+4+5 = 72
      expect(r.experiences_score).toBe(72);
    });

    it("+1 when 0 anniversaries", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries: [] }));
      // mod4: +1, mod5: +2 (0 anniv bonus)
      // voice: 10h/10 = 100% → +5
      // 52+5+6+5+1+2+5 = 76
      expect(r.experiences_score).toBe(76);
    });
  });

  // ── Modifier 5: Positive anniversary ─────────────────────────────────
  describe("modifier: positive anniversary rate", () => {
    it("+4 when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.positive_anniversary_rate).toBe(100);
    });

    it("+1 when 70-89%", () => {
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, child_attitude: i < 8 ? "positive" : "anxious",
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries }));
      // 80% positive → +1. 82-4+1 = 79
      expect(r.experiences_score).toBe(79);
    });

    it("-4 when < 50%", () => {
      const anniversaries = Array.from({ length: 10 }, (_, i) => makeAnniversary({
        id: `a_${i}`, child_attitude: i < 4 ? "positive" : "distressed",
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries }));
      // 40% positive → -4. 82-4-4 = 74
      expect(r.experiences_score).toBe(74);
    });
  });

  // ── Modifier 6: Holiday frequency ────────────────────────────────────
  describe("modifier: holiday frequency per child", () => {
    it("+5 when >= 2 per child", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      // 10/4 = 2.5 → +5
      expect(r.experiences_score).toBe(82);
    });

    it("+2 when 1-1.99 per child", () => {
      const holidays = Array.from({ length: 4 }, (_, i) => makeHoliday({ id: `h_${i}` }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      // 4/4 = 1.0 → +2. 82-5+2 = 79
      expect(r.experiences_score).toBe(79);
    });

    it("-5 when 0 holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [] }));
      // 0 holidays → mod1=-2, mod2=0, mod6=-5
      // 52-2+0+5+5+4-5 = 59
      expect(r.experiences_score).toBe(59);
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("calculates total_holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.total_holidays).toBe(10);
    });

    it("calculates child_choice_rate", () => {
      const holidays = [
        makeHoliday({ id: "a", child_chose_destination: true }),
        makeHoliday({ id: "b", child_chose_destination: false }),
      ];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      expect(r.child_choice_rate).toBe(50);
    });

    it("calculates photos_documented_rate", () => {
      const holidays = [
        makeHoliday({ id: "a", photos_taken: true }),
        makeHoliday({ id: "b", photos_taken: true }),
        makeHoliday({ id: "c", photos_taken: false }),
      ];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      expect(r.photos_documented_rate).toBe(67);
    });

    it("calculates anniversaries_planned_rate", () => {
      const anniversaries = [
        makeAnniversary({ id: "a", has_upcoming_plan: true }),
        makeAnniversary({ id: "b", has_upcoming_plan: false }),
      ];
      const r = computeHolidayEnrichingExperiences(baseInput({ anniversaries }));
      expect(r.anniversaries_planned_rate).toBe(50);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes child choice strength when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.strengths.some(s => s.includes("choose"))).toBe(true);
    });

    it("includes photo strength when >= 90%", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.strengths.some(s => s.includes("photo") || s.includes("Photo"))).toBe(true);
    });

    it("has no strengths when everything is poor", () => {
      const holidays = [makeHoliday({
        child_chose_destination: false, photos_taken: false, has_child_voice: false,
      })];
      const anniversaries = [makeAnniversary({
        has_upcoming_plan: false, child_attitude: "distressed", has_child_voice: false,
      })];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags 0 holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [] }));
      expect(r.concerns.some(c => c.includes("holiday"))).toBe(true);
    });

    it("has no concerns for outstanding input", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.concerns.length).toBe(0);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates recommendations for 0 holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [] }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("caps at 5", () => {
      const holidays = [makeHoliday({
        child_chose_destination: false, photos_taken: false, has_child_voice: false,
      })];
      const anniversaries = [makeAnniversary({
        has_upcoming_plan: false, child_attitude: "distressed", has_child_voice: false,
      })];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries }));
      expect(r.recommendations.length).toBeLessThan(6);
    });

    it("has sequential ranks", () => {
      const holidays = [makeHoliday({
        child_chose_destination: false, photos_taken: false, has_child_voice: false,
      })];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory refs", () => {
      const holidays = [makeHoliday({ child_chose_destination: false })];
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref === "CHR 2015 Reg 9" || rec.regulatory_ref === "SCCIF Experiences").toBe(true);
      }
    });

    it("returns empty for outstanding", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for excellent holiday provision", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight when 0 holidays", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays: [] }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("caps at 3", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r.insights.length).toBeLessThan(4);
    });
  });

  // ── Score clamping ───────────────────────────────────────────────────
  describe("score clamping", () => {
    it("clamps to minimum 0", () => {
      const holidays = Array.from({ length: 1 }, (_, i) => makeHoliday({
        id: `h_${i}`, child_chose_destination: false, photos_taken: false, has_child_voice: false,
      }));
      const anniversaries = Array.from({ length: 20 }, (_, i) => makeAnniversary({
        id: `a_${i}`, has_upcoming_plan: false, child_attitude: "distressed", has_child_voice: false,
      }));
      const r = computeHolidayEnrichingExperiences(baseInput({ holidays, anniversaries, total_children: 10 }));
      expect(r.experiences_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single holiday and anniversary", () => {
      const r = computeHolidayEnrichingExperiences(baseInput({
        total_children: 1,
        holidays: [makeHoliday()],
        anniversaries: [makeAnniversary()],
      }));
      expect(r.total_holidays).toBe(1);
      expect(r.experiences_rating).toBe("good");
    });

    it("return shape has all required fields", () => {
      const r = computeHolidayEnrichingExperiences(baseInput());
      expect(r).toHaveProperty("experiences_rating");
      expect(r).toHaveProperty("experiences_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_holidays");
      expect(r).toHaveProperty("child_choice_rate");
      expect(r).toHaveProperty("photos_documented_rate");
      expect(r).toHaveProperty("child_voice_rate");
      expect(r).toHaveProperty("anniversaries_planned_rate");
      expect(r).toHaveProperty("positive_anniversary_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });
  });
});
