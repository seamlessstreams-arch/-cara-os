import { describe, it, expect } from "vitest";
import {
  computeHomeChronology,
  type HomeChronologyInput,
  type ChronologyEntryInput,
} from "../home-chronology-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeEntry(overrides?: Partial<ChronologyEntryInput>): ChronologyEntryInput {
  return {
    id: "e1",
    child_id: "c1",
    date: "2026-05-01",
    category: "placement",
    significance: "significant",
    has_linked_incident: false,
    has_description: true,
    has_time: true,
    ...overrides,
  };
}

function baseInput(overrides?: Partial<HomeChronologyInput>): HomeChronologyInput {
  return {
    today: TODAY,
    entries: [],
    total_children: 3,
    lookback_days: 180,
    ...overrides,
  };
}

// Outstanding-ready data set: 11 entries per child + mid-May bridge + recent entries → no gap >14d
function outstandingEntries(): ChronologyEntryInput[] {
  const cats = ["placement", "education", "health", "safeguarding", "missing", "review", "contact"];
  return [
    ...makeMonthlyEntries("c1", 11, "2025-12-15", cats),
    ...makeMonthlyEntries("c2", 11, "2025-12-15", cats),
    ...makeMonthlyEntries("c3", 11, "2025-12-15", cats),
    makeEntry({ id: "mid_c1", child_id: "c1", date: "2026-05-10", category: "review" }),
    makeEntry({ id: "recent_c1", child_id: "c1", date: "2026-05-20", category: "contact" }),
    makeEntry({ id: "recent_c2", child_id: "c2", date: "2026-05-18", category: "health" }),
    makeEntry({ id: "recent_c3", child_id: "c3", date: "2026-05-22", category: "education" }),
  ];
}

// Generate entries spread across a date range for a child
function makeMonthlyEntries(childId: string, count: number, startDate: string, categories: string[]): ChronologyEntryInput[] {
  const entries: ChronologyEntryInput[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 14); // every 2 weeks
    entries.push(makeEntry({
      id: `${childId}_e${i}`,
      child_id: childId,
      date: d.toISOString().slice(0, 10),
      category: categories[i % categories.length],
      significance: i === 0 ? "critical" : "significant",
      has_linked_incident: i === 0,
    }));
  }
  return entries;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Chronology Intelligence Engine", () => {

  // ── Insufficient Data ────────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data with no entries", () => {
      const r = computeHomeChronology(baseInput());
      expect(r.chronology_rating).toBe("insufficient_data");
      expect(r.chronology_score).toBe(0);
      expect(r.headline).toContain("No chronology entries");
    });

    it("returns insufficient_data when entries are outside lookback", () => {
      const r = computeHomeChronology(baseInput({
        entries: [makeEntry({ date: "2025-01-01" })], // outside 180 day lookback
      }));
      expect(r.chronology_rating).toBe("insufficient_data");
    });

    it("does not return insufficient_data when entries exist within lookback", () => {
      const r = computeHomeChronology(baseInput({
        entries: [makeEntry()],
      }));
      expect(r.chronology_rating).not.toBe("insufficient_data");
    });
  });

  // ── Outstanding ──────────────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with comprehensive, recent chronology", () => {
      const entries = outstandingEntries();
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      // 37 entries, coverage 100% → +5, desc 100% → +4
      // freq ≈6.2/mo → +3, categories 7 → +3, time 100% → +3
      // critical 3/3 with incident → +4, gap <=14 → +3, balance ≈0.92 → +3
      // = 52+5+4+3+3+3+4+3+3 = 80
      expect(r.chronology_rating).toBe("outstanding");
      expect(r.chronology_score).toBe(80);
    });

    it("generates strengths for outstanding", () => {
      const r = computeHomeChronology(baseInput({ entries: outstandingEntries(), total_children: 3 }));
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("children") || s.includes("coverage"))).toBe(true);
    });
  });

  // ── Good ──────────────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with minor gaps", () => {
      const cats = ["placement", "education", "health", "safeguarding", "missing"];
      const entries = [
        ...makeMonthlyEntries("c1", 5, "2026-02-01", cats),
        ...makeMonthlyEntries("c2", 5, "2026-02-01", cats),
        ...makeMonthlyEntries("c3", 5, "2026-02-01", cats),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      // 15 entries, coverage 100% → +5, desc 100% → +4, freq 2.5 → +1
      // cats 5 → +3, time 100% → +3, critical 3/3 incident → +4
      // gap: last entry ~Mar29, to May26 = 58d, 30<58<=60 → -1
      // balance: 5/5/5 → +3
      // = 52+5+4+1+3+3+4-1+3 = 74
      expect(r.chronology_rating).toBe("good");
      expect(r.chronology_score).toBe(74);
    });
  });

  // ── Adequate ──────────────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with coverage and quality gaps", () => {
      // Only 2 of 3 children covered, some entries lack description/time
      const entries = [
        makeEntry({ id: "e1", child_id: "c1", date: "2026-04-01", category: "placement", has_description: false, has_time: false }),
        makeEntry({ id: "e2", child_id: "c1", date: "2026-05-01", category: "health" }),
        makeEntry({ id: "e3", child_id: "c2", date: "2026-04-15", category: "education", has_time: false }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      // coverage: 2/3=67% >=50% → -1, desc: 2/3=67% >=50% → -1
      // freq: 3 entries, 6 months, 0.5/mo → -1
      // categories: 3 >=3 → +1, time: 1/3=33% <40% → -2
      // critical: 0 → +1, gap: c1 Apr01→May01=30d, c2 Apr15, sorted: Apr01→Apr15→May01 = 14d + 16d, max=25d gap to today → +1
      // balance: c1=2, c2=1, but missing c3 → -2
      // = 52-1-1-1+1-2+1+1-2 = 48
      expect(r.chronology_rating).toBe("adequate");
      expect(r.chronology_score).toBe(48);
    });
  });

  // ── Inadequate ────────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with poor coverage and quality", () => {
      const entries = [
        makeEntry({ id: "e1", child_id: "c1", date: "2026-03-01", has_description: false, has_time: false }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      // coverage: 1/3=33% <50% → -4, desc: 0% → -3
      // freq: 1/6=0.2/mo <0.5 → -3
      // categories: 1 <3 → -2, time: 0% → -2
      // critical: 0 → +1, gap: only 1 entry, gap to today = 86d >60 → -3
      // balance: c1=1, missing c2,c3 → -2
      // = 52-4-3-3-2-2+1-3-2 = 34
      expect(r.chronology_rating).toBe("inadequate");
      expect(r.chronology_score).toBe(34);
    });

    it("generates critical insights for missing children", () => {
      const entries = [makeEntry({ child_id: "c1" })];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no chronology"))).toBe(true);
    });
  });

  // ── Event Distribution ───────────────────────────────────────────────────

  describe("event distribution", () => {
    it("counts significance levels", () => {
      const entries = [
        makeEntry({ id: "e1", significance: "critical" }),
        makeEntry({ id: "e2", significance: "critical" }),
        makeEntry({ id: "e3", significance: "significant" }),
        makeEntry({ id: "e4", significance: "routine" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.event_distribution.critical_count).toBe(2);
      expect(r.event_distribution.significant_count).toBe(1);
      expect(r.event_distribution.routine_count).toBe(1);
    });

    it("builds category breakdown", () => {
      const entries = [
        makeEntry({ id: "e1", category: "health" }),
        makeEntry({ id: "e2", category: "health" }),
        makeEntry({ id: "e3", category: "education" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.event_distribution.category_breakdown["health"]).toBe(2);
      expect(r.event_distribution.category_breakdown["education"]).toBe(1);
      expect(r.event_distribution.categories_used).toBe(2);
    });
  });

  // ── Coverage Profile ─────────────────────────────────────────────────────

  describe("coverage profile", () => {
    it("calculates child coverage", () => {
      const entries = [
        makeEntry({ id: "e1", child_id: "c1" }),
        makeEntry({ id: "e2", child_id: "c1" }),
        makeEntry({ id: "e3", child_id: "c2" }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.coverage_profile.children_with_entries).toBe(2);
      expect(r.coverage_profile.children_without_entries).toBe(1);
      expect(r.coverage_profile.coverage_rate).toBe(67);
    });

    it("calculates average entries per child", () => {
      const entries = [
        makeEntry({ id: "e1", child_id: "c1" }),
        makeEntry({ id: "e2", child_id: "c2" }),
        makeEntry({ id: "e3", child_id: "c3" }),
        makeEntry({ id: "e4", child_id: "c1" }),
        makeEntry({ id: "e5", child_id: "c2" }),
        makeEntry({ id: "e6", child_id: "c3" }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.coverage_profile.avg_entries_per_child).toBe(2);
    });

    it("calculates min/max entries per child", () => {
      const entries = [
        makeEntry({ id: "e1", child_id: "c1" }),
        makeEntry({ id: "e2", child_id: "c1" }),
        makeEntry({ id: "e3", child_id: "c1" }),
        makeEntry({ id: "e4", child_id: "c2" }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 2 }));
      expect(r.coverage_profile.min_entries).toBe(1);
      expect(r.coverage_profile.max_entries).toBe(3);
    });
  });

  // ── Quality Profile ──────────────────────────────────────────────────────

  describe("quality profile", () => {
    it("calculates description and time rates", () => {
      const entries = [
        makeEntry({ id: "e1", has_description: true, has_time: true }),
        makeEntry({ id: "e2", has_description: true, has_time: false }),
        makeEntry({ id: "e3", has_description: false, has_time: false }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.quality_profile.description_rate).toBe(67);
      expect(r.quality_profile.time_recording_rate).toBe(33);
    });

    it("calculates critical-incident linkage rate", () => {
      const entries = [
        makeEntry({ id: "e1", significance: "critical", has_linked_incident: true }),
        makeEntry({ id: "e2", significance: "critical", has_linked_incident: false }),
        makeEntry({ id: "e3", significance: "significant", has_linked_incident: true }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.quality_profile.critical_with_incident_rate).toBe(50);
      expect(r.quality_profile.incident_linked_rate).toBe(67);
    });
  });

  // ── Timeliness Profile ───────────────────────────────────────────────────

  describe("timeliness profile", () => {
    it("counts entries in last 30 and 90 days", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-05-10" }),  // within 30d
        makeEntry({ id: "e2", date: "2026-04-01" }),   // within 90d but not 30d
        makeEntry({ id: "e3", date: "2026-01-01" }),   // within 180d but not 90d
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.timeliness_profile.entries_last_30_days).toBe(1);
      expect(r.timeliness_profile.entries_last_90_days).toBe(2);
    });

    it("calculates maximum recording gap", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-03-01" }),
        makeEntry({ id: "e2", date: "2026-04-15" }),   // 45 day gap
        makeEntry({ id: "e3", date: "2026-05-01" }),   // 16 day gap
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      // Gaps: Mar01→Apr15 = 45d, Apr15→May01 = 16d, May01→today(May26) = 25d
      expect(r.timeliness_profile.recording_gap_days).toBe(45);
    });

    it("calculates entries per month", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-03-01" }),
        makeEntry({ id: "e2", date: "2026-04-01" }),
        makeEntry({ id: "e3", date: "2026-05-01" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      // 3 entries over 6 months = 0.5
      expect(r.timeliness_profile.entries_per_month).toBe(0.5);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes coverage strength at 100%", () => {
      const entries = [
        makeEntry({ id: "e1", child_id: "c1" }),
        makeEntry({ id: "e2", child_id: "c2" }),
        makeEntry({ id: "e3", child_id: "c3" }),
      ];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.strengths.some(s => s.includes("children have chronology"))).toBe(true);
    });

    it("includes category diversity strength", () => {
      const entries = [
        makeEntry({ id: "e1", category: "placement" }),
        makeEntry({ id: "e2", category: "education" }),
        makeEntry({ id: "e3", category: "health" }),
        makeEntry({ id: "e4", category: "safeguarding" }),
        makeEntry({ id: "e5", category: "missing" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.strengths.some(s => s.includes("categories"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags missing children", () => {
      const entries = [makeEntry({ child_id: "c1" })];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.concerns.some(c => c.includes("no chronology entries"))).toBe(true);
    });

    it("flags large recording gaps", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-02-01" }),
        makeEntry({ id: "e2", date: "2026-05-01" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.concerns.some(c => c.includes("gap"))).toBe(true);
    });

    it("flags low description rate", () => {
      const entries = [
        makeEntry({ id: "e1", has_description: false }),
        makeEntry({ id: "e2", has_description: false }),
        makeEntry({ id: "e3", has_description: true }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.concerns.some(c => c.includes("description"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends entries for uncovered children", () => {
      const entries = [makeEntry({ child_id: "c1" })];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("chronology entries"))).toBe(true);
    });

    it("recommends addressing recording gaps", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-02-01" }),
        makeEntry({ id: "e2", date: "2026-05-01" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("gap"))).toBe(true);
    });

    it("generates no recommendations for perfect chronology", () => {
      const r = computeHomeChronology(baseInput({ entries: outstandingEntries(), total_children: 3 }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary chronology", () => {
      const r = computeHomeChronology(baseInput({ entries: outstandingEntries(), total_children: 3 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for uncovered children", () => {
      const entries = [makeEntry({ child_id: "c1" })];
      const r = computeHomeChronology(baseInput({ entries, total_children: 3 }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("generates warning for large recording gap", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2026-02-01" }),
        makeEntry({ id: "e2", date: "2026-05-01" }),
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("gap"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const r = computeHomeChronology(baseInput({ entries: outstandingEntries(), total_children: 3 }));
      expect(r.headline).toContain("Outstanding");
    });

    it("generates insufficient_data headline", () => {
      const r = computeHomeChronology(baseInput());
      expect(r.headline).toContain("No chronology entries");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single child", () => {
      const entries = [makeEntry()];
      const r = computeHomeChronology(baseInput({ entries, total_children: 1 }));
      expect(r.coverage_profile.coverage_rate).toBe(100);
    });

    it("handles single entry", () => {
      const entries = [makeEntry()];
      const r = computeHomeChronology(baseInput({ entries, total_children: 1 }));
      expect(r.event_distribution.total_entries).toBe(1);
      expect(r.timeliness_profile.recording_gap_days).toBeGreaterThan(0);
    });

    it("handles zero total_children", () => {
      const entries = [makeEntry()];
      const r = computeHomeChronology(baseInput({ entries, total_children: 0 }));
      expect(r.coverage_profile.avg_entries_per_child).toBe(0);
    });

    it("filters entries outside lookback window", () => {
      const entries = [
        makeEntry({ id: "e1", date: "2025-01-01" }), // outside
        makeEntry({ id: "e2", date: "2026-05-01" }), // inside
      ];
      const r = computeHomeChronology(baseInput({ entries }));
      expect(r.event_distribution.total_entries).toBe(1);
    });
  });
});
