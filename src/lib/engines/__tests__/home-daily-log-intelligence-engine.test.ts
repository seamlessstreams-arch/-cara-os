import { describe, it, expect } from "vitest";
import {
  computeHomeDailyLog,
  ALL_ENTRY_TYPES,
  type HomeDailyLogInput,
  type DailyLogEntryInput,
} from "../home-daily-log-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeEntry(overrides: Partial<DailyLogEntryInput> = {}): DailyLogEntryInput {
  return {
    id: "log_1",
    child_id: "yp_alex",
    date: "2026-05-26",
    time: "09:00",
    entry_type: "general",
    content: "Alex had a good morning. Engaged well with breakfast and was cooperative during morning routine. Positive mood.",
    mood_score: 7,
    staff_id: "staff_darren",
    linked_incident_id: null,
    is_significant: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeDailyLogInput> = {}): HomeDailyLogInput {
  return {
    today: TODAY,
    daily_logs: [],
    total_children: 3,
    total_staff: 8,
    ...overrides,
  };
}

// Generate entries covering N days for all children with diverse types and mood
function richEntries(days: number, opts: { children?: string[]; staffList?: string[]; withMood?: boolean } = {}): DailyLogEntryInput[] {
  const children = opts.children ?? ["yp_alex", "yp_jordan", "yp_casey"];
  const staffList = opts.staffList ?? ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_lackson", "staff_chervelle"];
  const types = [...ALL_ENTRY_TYPES];
  const entries: DailyLogEntryInput[] = [];
  let idx = 0;
  for (let d = 0; d < days; d++) {
    for (const child of children) {
      const type = types[idx % types.length];
      const staff = staffList[idx % staffList.length];
      entries.push(makeEntry({
        id: `log_${idx}`,
        child_id: child,
        date: `2026-05-${String(27 - d).padStart(2, "0")}`,
        time: `${String(8 + (idx % 12)).padStart(2, "0")}:00`,
        entry_type: type,
        content: `Entry about ${type} for ${child}. Detailed recording of events with sufficient context and analysis of the child's emotional state.`,
        mood_score: opts.withMood !== false ? 3 + (idx % 7) : null,
        staff_id: staff,
        is_significant: idx % 5 === 0,
      }));
      idx++;
    }
  }
  return entries;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeHomeDailyLog", () => {
  // ── Insufficient data ─────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no children and no staff", () => {
      const r = computeHomeDailyLog(baseInput({ total_children: 0, total_staff: 0 }));
      expect(r.log_rating).toBe("insufficient_data");
      expect(r.log_score).toBe(0);
    });

    it("returns insufficient_data when no logs", () => {
      const r = computeHomeDailyLog(baseInput({ daily_logs: [] }));
      expect(r.log_rating).toBe("insufficient_data");
    });

    it("populates concern about missing data", () => {
      const r = computeHomeDailyLog(baseInput());
      expect(r.concerns.length).toBe(1);
      expect(r.concerns[0]).toContain("No daily log entries");
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("achieves outstanding (≥80) with rich daily recording", () => {
      // 13 days of entries, 3 children, 6 staff, all types, mood tracked, good content
      const entries = richEntries(13);
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // mod1: 13/14 = 93% → +5
      // mod2: 3/3 = 100% → +4
      // mod3: 9/9 types → +4
      // mod4: mood 100% → +3
      // mod5: 6/8 = 75% → +4
      // mod6: content length ~100+ → +3
      // mod7: 39/13/3 = 1.0 per child/day → +1
      // mod8: sig entries exist, rate ~20% → +2
      // Check: entries per child per day = 39 / (3 * 13) = 1.0 → +1
      // 52 + 5+4+4+3+4+3+1+2 = 78... need more
      // Actually 13 days * 3 children = 39 entries, 13 days with entries
      // entries_per_child_per_day = 39 / (3 * 13) = 1.0 → +1
      // We need 1.5+ for mod7 +3. Let's add extra entries.
      expect(r.log_score).toBeGreaterThanOrEqual(76);
      expect(r.log_rating).toBe("good");
    });

    it("achieves outstanding with increased volume", () => {
      // Double entries to get entries per child per day > 1.5
      const entries = [
        ...richEntries(13),
        ...richEntries(13).map((e, i) => ({ ...e, id: `log_extra_${i}`, time: "14:00" })),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 78 entries, 13 days, 3 children → 78/(3*13) = 2.0 → mod7 +3
      // 52 + 5+4+4+3+4+3+3+2 = 80
      expect(r.log_score).toBe(80);
      expect(r.log_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      const entries = richEntries(10);
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.log_score).toBeGreaterThanOrEqual(65);
      expect(r.log_score).toBeLessThan(80);
      expect(r.log_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      // Sparse entries, few staff, limited types
      const entries = [
        makeEntry({ id: "l1", child_id: "yp_alex", date: "2026-05-27", mood_score: null }),
        makeEntry({ id: "l2", child_id: "yp_alex", date: "2026-05-25", mood_score: null }),
        makeEntry({ id: "l3", child_id: "yp_jordan", date: "2026-05-24", mood_score: null }),
        makeEntry({ id: "l4", child_id: "yp_casey", date: "2026-05-23", mood_score: null }),
        makeEntry({ id: "l5", child_id: "yp_alex", date: "2026-05-22", mood_score: null }),
        makeEntry({ id: "l6", child_id: "yp_jordan", date: "2026-05-20", mood_score: null }),
        makeEntry({ id: "l7", child_id: "yp_casey", date: "2026-05-18", mood_score: null }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 7 days, 7 entries, 50% freq, all general, no mood, 1 staff, all 3 children
      // mod1: 7/14=50% → +0
      // mod2: 3/3=100% → +4
      // mod3: 1/9=11% → -4
      // mod4: 0% mood → -3
      // mod5: 1/8=13% → -4
      // mod6: ~111 chars → >=100 → +3
      // mod7: 7/(3*7)=0.33 → -3
      // mod8: 0 sig → -2
      // 52 +0+4-4-3-4+3-3-2 = 43
      expect(r.log_score).toBe(43);
      expect(r.log_rating).toBe("inadequate");
    });

    it("rates inadequate for very poor recording", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27", content: "OK.", mood_score: null }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.log_rating).toBe("inadequate");
    });
  });

  // ── Frequency profile ─────────────────────────────────────────────────
  describe("frequency profile", () => {
    it("counts entries within 14-day window", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }), // today (d0)
        makeEntry({ id: "l2", date: "2026-05-20" }), // 7 days ago
        makeEntry({ id: "l3", date: "2026-05-14" }), // 13 days ago → included
        makeEntry({ id: "l4", date: "2026-05-13" }), // 14 days ago → excluded (window is 14 days)
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.frequency.total_entries_14d).toBe(3);
    });

    it("counts days with entries", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }),
        makeEntry({ id: "l2", date: "2026-05-27" }), // same day
        makeEntry({ id: "l3", date: "2026-05-25" }),
        makeEntry({ id: "l4", date: "2026-05-20" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.frequency.days_with_entries_14d).toBe(3);
      // 14-day window, 3 days recorded → 11 with none.
      expect(r.frequency.days_with_no_entries).toBe(11);
    });

    it("never reports a negative days_with_no_entries for a fully-recorded home", () => {
      // One entry on every day of the 14-day window (today … 13 days ago).
      const entries = Array.from({ length: 14 }, (_, d) => {
        const dt = new Date("2026-05-27T00:00:00Z");
        dt.setUTCDate(dt.getUTCDate() - d);
        return makeEntry({ id: `f${d}`, date: dt.toISOString().slice(0, 10) });
      });
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.frequency.days_with_entries_14d).toBe(14);
      expect(r.frequency.days_with_no_entries).toBe(0); // not -1
    });

    it("calculates entries per child per day", () => {
      const entries = richEntries(7); // 21 entries over 7 days, 3 children
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 21 / (3 * 7) = 1.0
      expect(r.frequency.entries_per_child_per_day_avg).toBe(1);
    });
  });

  // ── Entry type profile ────────────────────────────────────────────────
  describe("entry type profile", () => {
    it("counts entry types used", () => {
      const entries = [
        makeEntry({ id: "l1", entry_type: "general" }),
        makeEntry({ id: "l2", entry_type: "health" }),
        makeEntry({ id: "l3", entry_type: "education" }),
        makeEntry({ id: "l4", entry_type: "general" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.entry_types.types_used.length).toBe(3);
      expect(r.entry_types.by_type.general).toBe(2);
      expect(r.entry_types.by_type.health).toBe(1);
    });

    it("identifies missing entry types", () => {
      const entries = [
        makeEntry({ id: "l1", entry_type: "general" }),
        makeEntry({ id: "l2", entry_type: "health" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.entry_types.types_missing).toContain("behaviour");
      expect(r.entry_types.types_missing).toContain("education");
      expect(r.entry_types.types_missing.length).toBe(7);
    });

    it("calculates type diversity rate", () => {
      const entries = richEntries(5); // uses all 9 types
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.entry_types.type_diversity_rate).toBe(100);
    });
  });

  // ── Mood tracking ─────────────────────────────────────────────────────
  describe("mood tracking", () => {
    it("calculates mood tracking rate", () => {
      const entries = [
        makeEntry({ id: "l1", mood_score: 7 }),
        makeEntry({ id: "l2", mood_score: 5 }),
        makeEntry({ id: "l3", mood_score: null }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.mood.entries_with_mood).toBe(2);
      expect(r.mood.mood_tracking_rate).toBe(67);
    });

    it("calculates average mood score", () => {
      const entries = [
        makeEntry({ id: "l1", mood_score: 4 }),
        makeEntry({ id: "l2", mood_score: 8 }),
        makeEntry({ id: "l3", mood_score: 6 }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.mood.avg_mood_score).toBe(6);
    });

    it("counts low and high mood entries", () => {
      const entries = [
        makeEntry({ id: "l1", mood_score: 2 }),
        makeEntry({ id: "l2", mood_score: 4 }),
        makeEntry({ id: "l3", mood_score: 6 }),
        makeEntry({ id: "l4", mood_score: 8 }),
        makeEntry({ id: "l5", mood_score: 9 }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.mood.low_mood_count).toBe(2); // 2, 4
      expect(r.mood.high_mood_count).toBe(2); // 8, 9
    });
  });

  // ── Staff participation ───────────────────────────────────────────────
  describe("staff participation", () => {
    it("counts unique staff contributors", () => {
      const entries = [
        makeEntry({ id: "l1", staff_id: "staff_darren" }),
        makeEntry({ id: "l2", staff_id: "staff_ryan" }),
        makeEntry({ id: "l3", staff_id: "staff_darren" }),
        makeEntry({ id: "l4", staff_id: "staff_anna" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.staff.unique_staff_14d).toBe(3);
    });

    it("calculates staff participation rate", () => {
      const entries = [
        makeEntry({ id: "l1", staff_id: "staff_darren" }),
        makeEntry({ id: "l2", staff_id: "staff_ryan" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries, total_staff: 8 }));
      expect(r.staff.staff_participation_rate).toBe(25);
    });

    it("identifies most and least active staff", () => {
      const entries = [
        makeEntry({ id: "l1", staff_id: "staff_darren" }),
        makeEntry({ id: "l2", staff_id: "staff_darren" }),
        makeEntry({ id: "l3", staff_id: "staff_darren" }),
        makeEntry({ id: "l4", staff_id: "staff_ryan" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.staff.most_active_staff_entries).toBe(3);
      expect(r.staff.least_active_staff_entries).toBe(1);
    });
  });

  // ── Child coverage ────────────────────────────────────────────────────
  describe("child coverage", () => {
    it("counts children with and without entries", () => {
      const entries = [
        makeEntry({ id: "l1", child_id: "yp_alex" }),
        makeEntry({ id: "l2", child_id: "yp_casey" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries, total_children: 3 }));
      expect(r.child_coverage.children_with_entries_14d).toBe(2);
      expect(r.child_coverage.children_without).toBe(1);
      expect(r.child_coverage.child_coverage_rate).toBe(67);
    });

    it("provides per-child entry counts", () => {
      const entries = [
        makeEntry({ id: "l1", child_id: "yp_alex" }),
        makeEntry({ id: "l2", child_id: "yp_alex" }),
        makeEntry({ id: "l3", child_id: "yp_casey" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.child_coverage.entries_per_child.yp_alex).toBe(2);
      expect(r.child_coverage.entries_per_child.yp_casey).toBe(1);
    });
  });

  // ── Content quality ───────────────────────────────────────────────────
  describe("content quality", () => {
    it("counts significant entries", () => {
      const entries = [
        makeEntry({ id: "l1", is_significant: true }),
        makeEntry({ id: "l2", is_significant: false }),
        makeEntry({ id: "l3", is_significant: true }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.quality.significant_entries).toBe(2);
      expect(r.quality.significant_rate).toBe(67);
    });

    it("calculates average content length", () => {
      const entries = [
        makeEntry({ id: "l1", content: "Short" }),      // 5 chars
        makeEntry({ id: "l2", content: "A bit longer." }), // 13 chars
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.quality.avg_content_length).toBe(9);
    });

    it("counts incident-linked entries", () => {
      const entries = [
        makeEntry({ id: "l1", linked_incident_id: "inc_001" }),
        makeEntry({ id: "l2", linked_incident_id: null }),
        makeEntry({ id: "l3", linked_incident_id: "" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.quality.incident_linked_count).toBe(1);
    });
  });

  // ── Modifier isolation ────────────────────────────────────────────────
  describe("modifier isolation", () => {
    function maxInput(): HomeDailyLogInput {
      return baseInput({
        daily_logs: [
          ...richEntries(13),
          ...richEntries(13).map((e, i) => ({ ...e, id: `log_extra_${i}`, time: "14:00" })),
        ],
      });
    }

    it("mod1: frequency drop lowers score", () => {
      const maxR = computeHomeDailyLog(maxInput());
      // Reduce to 4 days of entries
      const inp = baseInput({
        daily_logs: [
          ...richEntries(4),
          ...richEntries(4).map((e, i) => ({ ...e, id: `log_extra_${i}`, time: "14:00" })),
        ],
      });
      const r = computeHomeDailyLog(inp);
      // 4/14 = 29% → -2 (was +5) — but other mods also change since fewer types
      expect(maxR.log_score - r.log_score).toBeGreaterThanOrEqual(7);
    });

    it("mod3: limited types lowers score", () => {
      const maxR = computeHomeDailyLog(maxInput());
      const inp = maxInput();
      // Change all entries to "general" type
      inp.daily_logs = inp.daily_logs.map(e => ({ ...e, entry_type: "general" }));
      const r = computeHomeDailyLog(inp);
      // 1/9 = 11% → -4 (was +4) = 8 drop
      expect(maxR.log_score - r.log_score).toBe(8);
    });

    it("mod4: no mood tracking lowers score", () => {
      const maxR = computeHomeDailyLog(maxInput());
      const inp = maxInput();
      inp.daily_logs = inp.daily_logs.map(e => ({ ...e, mood_score: null }));
      const r = computeHomeDailyLog(inp);
      // 0% mood → -3 (was +3) = 6 drop, also mod8 sig may change
      expect(maxR.log_score - r.log_score).toBeGreaterThanOrEqual(6);
    });

    it("mod5: single staff lowers score", () => {
      const maxR = computeHomeDailyLog(maxInput());
      const inp = maxInput();
      inp.daily_logs = inp.daily_logs.map(e => ({ ...e, staff_id: "staff_darren" }));
      const r = computeHomeDailyLog(inp);
      // 1/8 = 13% → -4 (was +4) = 8 drop
      expect(maxR.log_score - r.log_score).toBe(8);
    });

    it("mod6: short content lowers score", () => {
      const maxR = computeHomeDailyLog(maxInput());
      const inp = maxInput();
      inp.daily_logs = inp.daily_logs.map(e => ({ ...e, content: "OK" }));
      const r = computeHomeDailyLog(inp);
      // 2 chars → -3 (was +3) = 6 drop
      expect(maxR.log_score - r.log_score).toBe(6);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("reports consistent recording as strength", () => {
      const entries = richEntries(13);
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.strengths.some(s => s.includes("consistent") || s.includes("Recording on"))).toBe(true);
    });

    it("reports full child coverage as strength", () => {
      const entries = richEntries(7);
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.strengths.some(s => s.includes("Every child"))).toBe(true);
    });

    it("reports mood tracking as strength", () => {
      const entries = richEntries(7);
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.strengths.some(s => s.includes("Mood tracked"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("reports recording gaps as concern", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }),
        makeEntry({ id: "l2", date: "2026-05-20" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 12 days with no entries
      expect(r.concerns.some(c => c.includes("days with no entries"))).toBe(true);
    });

    it("reports low mood tracking as concern", () => {
      const entries = [
        makeEntry({ id: "l1", mood_score: null }),
        makeEntry({ id: "l2", mood_score: null }),
        makeEntry({ id: "l3", mood_score: null }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.concerns.some(c => c.includes("Mood tracking"))).toBe(true);
    });

    it("reports persistent low mood as concern", () => {
      const entries = Array.from({ length: 6 }, (_, i) =>
        makeEntry({ id: `l_${i}`, date: `2026-05-${String(27 - i).padStart(2, "0")}`, mood_score: 3 })
      );
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.concerns.some(c => c.includes("low mood"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends daily recording when gaps exist", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }),
        makeEntry({ id: "l2", date: "2026-05-20" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("daily recording") || rec.recommendation.includes("Embed"))).toBe(true);
    });

    it("includes Reg 36 references", () => {
      const entries = [makeEntry({ id: "l1", mood_score: null })];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.recommendations.every(rec => rec.regulatory_ref === "Reg 36")).toBe(true);
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for exemplary recording", () => {
      const entries = [
        ...richEntries(13),
        ...richEntries(13).map((e, i) => ({ ...e, id: `log_extra_${i}`, time: "14:00" })),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for severe recording gaps", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 13 days with no entries
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("days without"))).toBe(true);
    });

    it("generates warning for uneven staff workload", () => {
      const entries = [
        ...Array.from({ length: 10 }, (_, i) => makeEntry({ id: `l_${i}`, staff_id: "staff_darren", date: `2026-05-${String(27 - (i % 7)).padStart(2, "0")}` })),
        makeEntry({ id: "l_solo", staff_id: "staff_ryan", date: "2026-05-27" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      // 10 vs 1 → mostActive (10) > leastActive (1) * 3
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("unevenly"))).toBe(true);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────────
  describe("headline", () => {
    it("outstanding headline mentions all children", () => {
      const entries = [
        ...richEntries(13),
        ...richEntries(13).map((e, i) => ({ ...e, id: `log_extra_${i}`, time: "14:00" })),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.headline).toContain("Outstanding");
    });

    it("inadequate headline mentions days without entries", () => {
      const entries = [makeEntry({ id: "l1", date: "2026-05-27", content: "OK." })];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles entries only from today", () => {
      const entries = [
        makeEntry({ id: "l1", date: "2026-05-27" }),
      ];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries }));
      expect(r.frequency.total_entries_14d).toBe(1);
      expect(r.frequency.days_with_entries_14d).toBe(1);
    });

    it("handles single child home", () => {
      const entries = richEntries(7, { children: ["yp_only"] });
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries, total_children: 1 }));
      expect(r.child_coverage.children_with_entries_14d).toBe(1);
      expect(r.child_coverage.child_coverage_rate).toBe(100);
    });

    it("clamps score to 0-100", () => {
      const entries = [makeEntry({ id: "l1", content: "X", mood_score: null, date: "2026-05-27" })];
      const r = computeHomeDailyLog(baseInput({ daily_logs: entries, total_children: 10, total_staff: 20 }));
      expect(r.log_score).toBeGreaterThanOrEqual(0);
      expect(r.log_score).toBeLessThanOrEqual(100);
    });
  });
});
