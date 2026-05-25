// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for recording compliance, quality scoring,
// staff recording profiles, and child mention coverage.
// Reg 36, SCCIF day-to-day evidence, child voice and mood capture.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRecordingQualityIntelligence,
  wordCount,
  type DailyLogInput,
  type ChildRef,
  type StaffRef,
} from "../recording-quality-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_edward", name: "Edward" },
  { id: "staff_lackson", name: "Lackson" },
];

// ── Helper to generate date strings ────────────────────────────────────────

function dayStr(daysAgo: number): string {
  const d = new Date(TODAY + "T00:00:00");
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Factory ────────────────────────────────────────────────────────────────

let _id = 0;

function makeEntry(overrides: Partial<DailyLogInput> = {}): DailyLogInput {
  return {
    id: overrides.id ?? `log_${++_id}`,
    child_id: "yp_alex",
    date: TODAY,
    time: "10:00",
    entry_type: "general",
    content:
      "The child had a positive morning engaging in activities and seemed settled",
    mood_score: 7,
    staff_id: "staff_darren",
    is_significant: false,
    ...overrides,
  };
}

// ── Word generators ────────────────────────────────────────────────────────

function words(n: number): string {
  const base = "word ";
  return base.repeat(n).trim();
}

function contentOf(wordTarget: number, prefix: string = ""): string {
  // Generates a string with roughly wordTarget words
  const prefixWords = prefix ? prefix.split(/\s+/).filter(Boolean).length : 0;
  const remaining = Math.max(wordTarget - prefixWords, 0);
  return prefix ? `${prefix} ${words(remaining)}` : words(wordTarget);
}

// ── Oak House realistic dataset: 25 entries across 7 days ──────────────────
// Darren: 8 entries, avg 80+ words, all mood, improving
// Ryan: 6 entries, avg 60+ words, most mood, stable
// Anna: 5 entries, avg 40+ words, some mood, stable
// Edward: 4 entries, avg 20 words, few mood, declining
// Lackson: 2 entries, avg 15 words, no mood, declining
// Alex: entries every day, Jordan: missing 1 day, Casey: missing 2 days

function buildOakHouseData(): DailyLogInput[] {
  _id = 100;
  const entries: DailyLogInput[] = [];

  // ─── Darren: 8 entries, improving trend ───────────────────────────────
  // First half (days 4-6): avg ~70 words
  entries.push(
    makeEntry({
      child_id: "yp_alex", date: dayStr(6), time: "09:00", staff_id: "staff_darren",
      entry_type: "general",
      content: contentOf(65, "Alex had a settled morning. Engaged with breakfast and participated in the morning routine with minimal prompting. Positive interactions observed with peers"),
      mood_score: 7, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_alex", date: dayStr(5), time: "10:00", staff_id: "staff_darren",
      entry_type: "education",
      content: contentOf(70, "Alex attended online schoolwork session this morning. Concentration was good for the first 30 minutes but became restless. Key worker supported with a break and he returned to complete the task"),
      mood_score: 6, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_casey", date: dayStr(4), time: "14:00", staff_id: "staff_darren",
      entry_type: "health",
      content: contentOf(75, "Casey attended a dental appointment today. She was anxious beforehand but was supported by staff with grounding techniques. The appointment went well and she was proud of herself afterwards"),
      mood_score: 5, is_significant: true,
    }),
  );
  // Second half (days 0-3): avg ~90 words (improving)
  entries.push(
    makeEntry({
      child_id: "yp_alex", date: dayStr(3), time: "09:00", staff_id: "staff_darren",
      entry_type: "mood",
      content: contentOf(85, "Alex presented as happy and relaxed this morning. He spoke about looking forward to football practice later and asked if he could call his grandmother. Staff facilitated the call and Alex appeared content afterwards. He engaged well with the group and helped tidy up the kitchen without being asked"),
      mood_score: 8, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_alex", date: dayStr(2), time: "11:00", staff_id: "staff_darren",
      entry_type: "activity",
      content: contentOf(90, "Alex went to the local football pitch with staff. He played well and showed good sportsmanship with the other young people. He was especially encouraging to a younger player who was struggling. On the way home he talked about wanting to join a local team. Staff will follow up with the activity coordinator to explore options"),
      mood_score: 9, is_significant: true,
    }),
    makeEntry({
      child_id: "yp_jordan", date: dayStr(1), time: "08:30", staff_id: "staff_darren",
      entry_type: "food",
      content: contentOf(88, "Jordan had a good breakfast this morning. He chose to make scrambled eggs and toast independently with minimal supervision. He remembered the halal requirements and checked labels before cooking. This demonstrates developing life skills and increased confidence in the kitchen. Staff praised his independence"),
      mood_score: 7, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_casey", date: TODAY, time: "09:30", staff_id: "staff_darren",
      entry_type: "contact",
      content: contentOf(95, "Casey had a scheduled phone call with her mother today. The call lasted approximately 20 minutes and Casey appeared calm throughout. She shared news about her recent school achievement and her mother responded positively. After the call Casey was smiling and said she felt happy. This is a notable improvement from previous contact sessions which sometimes resulted in emotional dysregulation. Will update the contact plan"),
      mood_score: 7, is_significant: true,
    }),
    makeEntry({
      child_id: "yp_alex", date: TODAY, time: "10:00", staff_id: "staff_darren",
      entry_type: "general",
      content: contentOf(92, "Alex had an excellent start to the day. He woke up on time and completed his morning routine independently. He was cheerful at breakfast and engaged in positive conversation with both peers and staff. He asked about plans for the weekend and expressed interest in going to the cinema. Staff will explore options and discuss with the team during handover"),
      mood_score: 8, is_significant: false,
    }),
  );

  // ─── Ryan: 6 entries, stable trend ────────────────────────────────────
  // First half: avg ~60 words
  entries.push(
    makeEntry({
      child_id: "yp_alex", date: dayStr(6), time: "14:00", staff_id: "staff_ryan",
      entry_type: "behaviour",
      content: contentOf(58, "Alex became frustrated during an argument with Jordan about television. Staff intervened using de-escalation techniques. Alex responded well to redirection and apologised to Jordan after 15 minutes"),
      mood_score: 4, is_significant: true,
    }),
    makeEntry({
      child_id: "yp_jordan", date: dayStr(5), time: "15:00", staff_id: "staff_ryan",
      entry_type: "activity",
      content: contentOf(62, "Jordan participated in a cooking session this afternoon. He prepared pasta with staff support. Good engagement throughout and he served portions for the other young people. Positive social interaction observed"),
      mood_score: 8, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_casey", date: dayStr(4), time: "16:00", staff_id: "staff_ryan",
      entry_type: "mood",
      content: contentOf(55, "Casey appeared withdrawn this afternoon. She declined to participate in group activities and spent time in her room. Staff checked in regularly and offered alternatives. She eventually came down for dinner"),
      mood_score: 3, is_significant: false,
    }),
  );
  // Second half: avg ~62 words (stable)
  entries.push(
    makeEntry({
      child_id: "yp_jordan", date: dayStr(2), time: "10:00", staff_id: "staff_ryan",
      entry_type: "general",
      content: contentOf(60, "Jordan had a positive morning. He engaged well with the morning routine and showed good peer relationships at breakfast. He spoke about wanting to attend a youth group and staff encouraged this aspiration"),
      mood_score: 7, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_alex", date: dayStr(1), time: "16:00", staff_id: "staff_ryan",
      entry_type: "sleep",
      content: contentOf(65, "Alex settled well for bed at 9pm. He read for approximately 20 minutes before lights out. Night checks showed he was sleeping soundly. No disturbances reported. This is an improvement from earlier in the week when he was restless"),
      mood_score: 6, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_jordan", date: TODAY, time: "11:00", staff_id: "staff_ryan",
      entry_type: "education",
      content: contentOf(60, "Jordan attended his online English lesson today. He completed the assigned reading and answered questions well. Teacher feedback was positive. Jordan expressed pride in his work and asked about the next assignment"),
      mood_score: null, is_significant: false,
    }),
  );

  // ─── Anna: 5 entries, stable trend ────────────────────────────────────
  // First half: avg ~40 words
  entries.push(
    makeEntry({
      child_id: "yp_casey", date: dayStr(5), time: "09:00", staff_id: "staff_anna",
      entry_type: "general",
      content: contentOf(38, "Casey had a quiet morning. She engaged with breakfast and completed her personal care routine with some prompting. Mood appeared settled"),
      mood_score: 6, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_alex", date: dayStr(4), time: "11:00", staff_id: "staff_anna",
      entry_type: "education",
      content: contentOf(42, "Alex completed maths work this morning with some staff support. He found fractions difficult but persevered. Good effort shown throughout the session"),
      mood_score: 7, is_significant: false,
    }),
  );
  // Second half: avg ~42 words (stable)
  entries.push(
    makeEntry({
      child_id: "yp_alex", date: dayStr(3), time: "14:00", staff_id: "staff_anna",
      entry_type: "contact",
      content: contentOf(40, "Alex had a video call with his social worker today. He shared his views about the upcoming LAC review and asked questions about his placement plan"),
      mood_score: 6, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_casey", date: dayStr(1), time: "10:00", staff_id: "staff_anna",
      entry_type: "health",
      content: contentOf(44, "Casey took her morning medication as prescribed. She asked about a rash on her arm. Staff will arrange a GP appointment. No other health concerns noted today"),
      mood_score: 5, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_alex", date: dayStr(0), time: "14:00", staff_id: "staff_anna",
      entry_type: "behaviour",
      content: contentOf(40, "Alex was positive throughout the afternoon session. He showed good self-regulation when a minor disagreement arose and resolved it independently without staff intervention"),
      mood_score: 8, is_significant: false,
    }),
  );

  // ─── Edward: 4 entries, declining trend ───────────────────────────────
  // First half: avg ~25 words
  entries.push(
    makeEntry({
      child_id: "yp_jordan", date: dayStr(6), time: "20:00", staff_id: "staff_edward",
      entry_type: "sleep",
      content: contentOf(25, "Jordan settled for bed at 9pm. Night checks completed. He slept through the night with no disturbances reported"),
      mood_score: 6, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_casey", date: dayStr(5), time: "20:00", staff_id: "staff_edward",
      entry_type: "sleep",
      content: contentOf(24, "Casey went to bed at 8:30pm. She requested her night light. Settled within 20 minutes"),
      mood_score: null, is_significant: false,
    }),
  );
  // Second half: avg ~16 words (declining)
  entries.push(
    makeEntry({
      child_id: "yp_alex", date: dayStr(2), time: "20:00", staff_id: "staff_edward",
      entry_type: "sleep",
      content: contentOf(16, "Alex went to bed at 9:30pm. Settled quickly. No issues"),
      mood_score: null, is_significant: false,
    }),
    makeEntry({
      child_id: "yp_jordan", date: dayStr(0), time: "20:00", staff_id: "staff_edward",
      entry_type: "sleep",
      content: contentOf(15, "Jordan settled at 9pm. Night checks done. Slept well"),
      mood_score: null, is_significant: false,
    }),
  );

  // ─── Lackson: 2 entries, declining trend ──────────────────────────────
  // First half: 1 entry ~18 words
  entries.push(
    makeEntry({
      child_id: "yp_jordan", date: dayStr(4), time: "16:00", staff_id: "staff_lackson",
      entry_type: "activity",
      content: contentOf(18, "Jordan went to football training. Good session. He engaged well with the coach"),
      mood_score: null, is_significant: false,
    }),
  );
  // Second half: 1 entry ~12 words
  entries.push(
    makeEntry({
      child_id: "yp_casey", date: dayStr(0), time: "15:00", staff_id: "staff_lackson",
      entry_type: "activity",
      content: contentOf(12, "Casey went for a walk. Seemed fine. No concerns"),
      mood_score: null, is_significant: false,
    }),
  );

  return entries;
}

// ── Run helper ─────────────────────────────────────────────────────────────

function run(
  entries: DailyLogInput[],
  opts?: { children?: ChildRef[]; staff?: StaffRef[]; today?: string },
) {
  return computeRecordingQualityIntelligence({
    entries,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: opts?.today ?? TODAY,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Recording Quality Intelligence Engine", () => {
  // ── wordCount helper ──────────────────────────────────────────────────

  describe("wordCount", () => {
    it("counts words in a normal sentence", () => {
      expect(wordCount("The child had a good day")).toBe(6);
    });

    it("handles multiple spaces and tabs", () => {
      expect(wordCount("  The   child  had \t a  day  ")).toBe(5);
    });

    it("returns 0 for empty string", () => {
      expect(wordCount("")).toBe(0);
    });

    it("returns 0 for whitespace only", () => {
      expect(wordCount("   \t  \n  ")).toBe(0);
    });
  });

  // ── Empty input ───────────────────────────────────────────────────────

  describe("empty input", () => {
    it("returns zero totals with no entries", () => {
      const result = run([]);
      expect(result.overview.total_entries).toBe(0);
      expect(result.overview.entries_last_7_days).toBe(0);
      expect(result.overview.avg_entries_per_day).toBe(0);
      expect(result.overview.avg_content_length).toBe(0);
      expect(result.overview.mood_capture_rate).toBe(0);
    });

    it("returns zero quality breakdown with no entries", () => {
      const result = run([]);
      expect(result.quality_breakdown).toEqual({
        excellent: 0,
        good: 0,
        adequate: 0,
        poor: 0,
      });
    });

    it("produces no staff profiles with no entries", () => {
      const result = run([]);
      expect(result.staff_profiles).toHaveLength(0);
    });

    it("generates child coverage with zero entries for each child", () => {
      const result = run([]);
      expect(result.child_coverage).toHaveLength(3);
      for (const cc of result.child_coverage) {
        expect(cc.entries_last_7_days).toBe(0);
        expect(cc.days_without_entry).toBe(7);
        expect(cc.has_entry_today).toBe(false);
      }
    });

    it("generates critical alerts for all children with no entries", () => {
      const result = run([]);
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(3);
    });
  });

  // ── Overview ──────────────────────────────────────────────────────────

  describe("overview", () => {
    const oakData = buildOakHouseData();
    const result = run(oakData);

    it("counts total entries", () => {
      expect(result.overview.total_entries).toBe(25);
    });

    it("counts entries in last 7 days", () => {
      // All 25 entries are within the last 7 days
      expect(result.overview.entries_last_7_days).toBe(25);
    });

    it("calculates avg entries per day over 7 days", () => {
      // 25 entries / 7 days
      expect(result.overview.avg_entries_per_day).toBe(
        Math.round((25 / 7) * 10) / 10,
      );
    });

    it("calculates avg content length in words", () => {
      expect(result.overview.avg_content_length).toBeGreaterThan(0);
    });

    it("calculates mood capture rate", () => {
      // Count entries with mood_score not null in oakData
      const withMood = oakData.filter((e) => e.mood_score !== null).length;
      const expected = Math.round((withMood / 25) * 100 * 10) / 10;
      expect(result.overview.mood_capture_rate).toBe(expected);
    });

    it("counts significant events", () => {
      const sig = oakData.filter((e) => e.is_significant).length;
      expect(result.overview.significant_events_count).toBe(sig);
    });

    it("calculates entry type coverage", () => {
      const types = new Set(oakData.map((e) => e.entry_type));
      const expected = Math.round((types.size / 9) * 100 * 10) / 10;
      expect(result.overview.entry_type_coverage).toBe(expected);
    });

    it("counts children with entries today", () => {
      const todayChildren = new Set(
        oakData.filter((e) => e.date === TODAY).map((e) => e.child_id),
      );
      expect(result.overview.children_with_entries_today).toBe(todayChildren.size);
    });
  });

  // ── Quality breakdown ─────────────────────────────────────────────────

  describe("quality breakdown", () => {
    it("classifies excellent entries (>=100 words AND mood present)", () => {
      const entry = makeEntry({
        content: words(105),
        mood_score: 7,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.excellent).toBe(1);
    });

    it("does NOT classify as excellent without mood score even with 100+ words", () => {
      const entry = makeEntry({
        content: words(105),
        mood_score: null,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.excellent).toBe(0);
      expect(result.quality_breakdown.good).toBe(1); // >= 50 words
    });

    it("classifies good entries (>=50 words)", () => {
      const entry = makeEntry({
        content: words(55),
        mood_score: null,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.good).toBe(1);
    });

    it("classifies good entries (>=30 words AND mood)", () => {
      const entry = makeEntry({
        content: words(32),
        mood_score: 6,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.good).toBe(1);
    });

    it("classifies adequate entries (>=15 words but <30 without mood)", () => {
      const entry = makeEntry({
        content: words(20),
        mood_score: null,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.adequate).toBe(1);
    });

    it("classifies poor entries (<15 words)", () => {
      const entry = makeEntry({
        content: "Very short note",
        mood_score: null,
      });
      const result = run([entry]);
      expect(result.quality_breakdown.poor).toBe(1);
    });

    it("sums all quality categories to total entries", () => {
      const oakData = buildOakHouseData();
      const result = run(oakData);
      const sum =
        result.quality_breakdown.excellent +
        result.quality_breakdown.good +
        result.quality_breakdown.adequate +
        result.quality_breakdown.poor;
      expect(sum).toBe(25);
    });
  });

  // ── Staff recording profiles ──────────────────────────────────────────

  describe("staff profiles", () => {
    const oakData = buildOakHouseData();
    const result = run(oakData);

    it("creates profiles only for staff with entries", () => {
      expect(result.staff_profiles.length).toBe(5);
    });

    it("Darren has 8 records", () => {
      const darren = result.staff_profiles.find(
        (s) => s.staff_id === "staff_darren",
      )!;
      expect(darren.total_records).toBe(8);
    });

    it("Ryan has 6 records", () => {
      const ryan = result.staff_profiles.find(
        (s) => s.staff_id === "staff_ryan",
      )!;
      expect(ryan.total_records).toBe(6);
    });

    it("Anna has 5 records", () => {
      const anna = result.staff_profiles.find(
        (s) => s.staff_id === "staff_anna",
      )!;
      expect(anna.total_records).toBe(5);
    });

    it("Edward has 4 records", () => {
      const edward = result.staff_profiles.find(
        (s) => s.staff_id === "staff_edward",
      )!;
      expect(edward.total_records).toBe(4);
    });

    it("Lackson has 2 records", () => {
      const lackson = result.staff_profiles.find(
        (s) => s.staff_id === "staff_lackson",
      )!;
      expect(lackson.total_records).toBe(2);
    });

    it("Darren avg word count is 80+", () => {
      const darren = result.staff_profiles.find(
        (s) => s.staff_id === "staff_darren",
      )!;
      expect(darren.avg_word_count).toBeGreaterThanOrEqual(70);
    });

    it("Darren trend is improving", () => {
      const darren = result.staff_profiles.find(
        (s) => s.staff_id === "staff_darren",
      )!;
      expect(darren.trend).toBe("improving");
    });

    it("Ryan trend is stable", () => {
      const ryan = result.staff_profiles.find(
        (s) => s.staff_id === "staff_ryan",
      )!;
      expect(ryan.trend).toBe("stable");
    });

    it("Edward trend is declining", () => {
      const edward = result.staff_profiles.find(
        (s) => s.staff_id === "staff_edward",
      )!;
      expect(edward.trend).toBe("declining");
    });

    it("Lackson trend is declining", () => {
      const lackson = result.staff_profiles.find(
        (s) => s.staff_id === "staff_lackson",
      )!;
      expect(lackson.trend).toBe("declining");
    });

    it("quality label is Excellent for avg >=100", () => {
      const entry = makeEntry({
        content: words(120),
        mood_score: 8,
        staff_id: "staff_darren",
      });
      const r = run([entry], {
        staff: [{ id: "staff_darren", name: "Darren" }],
      });
      expect(r.staff_profiles[0].quality_label).toBe("Excellent");
    });

    it("quality label is Good for avg >=50", () => {
      const entry = makeEntry({
        content: words(55),
        mood_score: null,
        staff_id: "staff_ryan",
      });
      const r = run([entry], {
        staff: [{ id: "staff_ryan", name: "Ryan" }],
      });
      expect(r.staff_profiles[0].quality_label).toBe("Good");
    });

    it("quality label is Adequate for avg >=15", () => {
      const entry = makeEntry({
        content: words(20),
        mood_score: null,
        staff_id: "staff_edward",
      });
      const r = run([entry], {
        staff: [{ id: "staff_edward", name: "Edward" }],
      });
      expect(r.staff_profiles[0].quality_label).toBe("Adequate");
    });

    it("quality label is Poor for avg <15", () => {
      const entry = makeEntry({
        content: "Short note",
        mood_score: null,
        staff_id: "staff_lackson",
      });
      const r = run([entry], {
        staff: [{ id: "staff_lackson", name: "Lackson" }],
      });
      expect(r.staff_profiles[0].quality_label).toBe("Poor");
    });

    it("mood capture rate calculated per staff", () => {
      const darren = result.staff_profiles.find(
        (s) => s.staff_id === "staff_darren",
      )!;
      // All 8 of Darren's entries have mood scores
      expect(darren.mood_capture_rate).toBe(100);
    });
  });

  // ── Child coverage ────────────────────────────────────────────────────

  describe("child coverage", () => {
    const oakData = buildOakHouseData();
    const result = run(oakData);

    it("returns coverage for all children", () => {
      expect(result.child_coverage).toHaveLength(3);
    });

    it("Alex has entries every day (0 days without)", () => {
      const alex = result.child_coverage.find((c) => c.child_id === "yp_alex")!;
      expect(alex.days_without_entry).toBe(0);
    });

    it("Alex has entry today", () => {
      const alex = result.child_coverage.find((c) => c.child_id === "yp_alex")!;
      expect(alex.has_entry_today).toBe(true);
    });

    it("Jordan is missing entries on some days", () => {
      const jordan = result.child_coverage.find(
        (c) => c.child_id === "yp_jordan",
      )!;
      expect(jordan.days_without_entry).toBeGreaterThanOrEqual(1);
    });

    it("Casey is missing entries on some days", () => {
      const casey = result.child_coverage.find(
        (c) => c.child_id === "yp_casey",
      )!;
      expect(casey.days_without_entry).toBeGreaterThanOrEqual(2);
    });

    it("entry_types_used lists unique types", () => {
      const alex = result.child_coverage.find((c) => c.child_id === "yp_alex")!;
      expect(alex.entry_types_used.length).toBeGreaterThan(0);
      // No duplicates
      expect(new Set(alex.entry_types_used).size).toBe(
        alex.entry_types_used.length,
      );
    });

    it("entry_types_used are sorted alphabetically", () => {
      const alex = result.child_coverage.find((c) => c.child_id === "yp_alex")!;
      const sorted = [...alex.entry_types_used].sort();
      expect(alex.entry_types_used).toEqual(sorted);
    });

    it("child with no entries in 7 days has 7 days without", () => {
      const entries = [
        makeEntry({ child_id: "yp_alex", date: TODAY }),
      ];
      const r = run(entries);
      const jordan = r.child_coverage.find((c) => c.child_id === "yp_jordan")!;
      expect(jordan.entries_last_7_days).toBe(0);
      expect(jordan.days_without_entry).toBe(7);
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("generates critical alert for child with 0 entries in 7 days", () => {
      const entries = [makeEntry({ child_id: "yp_alex" })];
      const result = run(entries);
      const critAlerts = result.alerts.filter((a) => a.severity === "critical");
      // Jordan and Casey have no entries
      expect(critAlerts).toHaveLength(2);
      expect(critAlerts[0].message).toContain("Reg 36 breach");
    });

    it("generates high alert for child with no entry today", () => {
      const entries = [
        makeEntry({ child_id: "yp_alex", date: TODAY }),
        makeEntry({ child_id: "yp_jordan", date: dayStr(1) }), // yesterday only
      ];
      const result = run(entries);
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      // Jordan and Casey have no entry today
      expect(highAlerts.some((a) => a.message.includes("Jordan"))).toBe(true);
      expect(highAlerts.some((a) => a.message.includes("Casey"))).toBe(true);
    });

    it("generates medium alert when avg content < 30 words", () => {
      const entries = [
        makeEntry({ content: "Short note about the child", mood_score: 7 }),
      ];
      const result = run(entries);
      const medAlerts = result.alerts.filter((a) => a.severity === "medium");
      expect(
        medAlerts.some((a) => a.message.includes("below minimum standard")),
      ).toBe(true);
    });

    it("generates medium alert when mood capture < 50%", () => {
      const entries = [
        makeEntry({ content: words(40), mood_score: null }),
        makeEntry({ content: words(40), mood_score: null }),
        makeEntry({ content: words(40), mood_score: 7 }),
      ];
      const result = run(entries);
      const medAlerts = result.alerts.filter((a) => a.severity === "medium");
      expect(medAlerts.some((a) => a.message.includes("Mood score"))).toBe(true);
    });

    it("generates low alert for staff with declining trend", () => {
      const oakData = buildOakHouseData();
      const result = run(oakData);
      const lowAlerts = result.alerts.filter((a) => a.severity === "low");
      expect(
        lowAlerts.some((a) => a.message.includes("declining")),
      ).toBe(true);
    });

    it("no medium alert when avg content >= 30 words", () => {
      const entries = Array.from({ length: 3 }, () =>
        makeEntry({ content: words(40), mood_score: 7 }),
      );
      const result = run(entries);
      const medAlerts = result.alerts.filter(
        (a) =>
          a.severity === "medium" &&
          a.message.includes("below minimum standard"),
      );
      expect(medAlerts).toHaveLength(0);
    });

    it("no mood alert when rate >= 50%", () => {
      const entries = [
        makeEntry({ content: words(40), mood_score: 7 }),
        makeEntry({ content: words(40), mood_score: 5 }),
      ];
      const result = run(entries);
      const moodAlerts = result.alerts.filter(
        (a) => a.severity === "medium" && a.message.includes("Mood score"),
      );
      expect(moodAlerts).toHaveLength(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for child with no entries", () => {
      const result = run([]);
      const critInsights = result.insights.filter(
        (i) => i.severity === "critical",
      );
      expect(critInsights).toHaveLength(3); // all 3 children
      expect(critInsights[0].text).toContain("Reg 36 breach");
    });

    it("generates warning insight for low word count", () => {
      const entries = [
        makeEntry({ content: "Short note about child", mood_score: 7 }),
      ];
      const result = run(entries);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(
        warnings.some((i) => i.text.includes("Average recording length")),
      ).toBe(true);
    });

    it("generates warning insight for low mood capture", () => {
      const entries = Array.from({ length: 5 }, (_, i) =>
        makeEntry({
          content: words(40),
          mood_score: i < 2 ? 7 : null, // only 40% have mood
        }),
      );
      const result = run(entries);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(
        warnings.some((i) => i.text.includes("Mood scores are captured")),
      ).toBe(true);
    });

    it("generates warning insight when poor quality > 20%", () => {
      const entries = [
        makeEntry({ content: "Short", mood_score: null }),
        makeEntry({ content: "Brief", mood_score: null }),
        makeEntry({ content: words(50), mood_score: 7 }),
      ];
      const result = run(entries);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(
        warnings.some((i) => i.text.includes("poor quality")),
      ).toBe(true);
    });

    it("generates positive insight when all children have entries today", () => {
      const entries = CHILDREN.map((c) =>
        makeEntry({
          child_id: c.id,
          date: TODAY,
          content: words(50),
          mood_score: 7,
        }),
      );
      const result = run(entries);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(
        positives.some((i) => i.text.includes("Excellent recording compliance")),
      ).toBe(true);
    });

    it("generates positive insight for high mood capture >= 80%", () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        makeEntry({
          content: words(50),
          mood_score: i < 2 ? null : 7, // 80% have mood
        }),
      );
      const result = run(entries);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(
        positives.some((i) =>
          i.text.includes("Strong evidence of child wellbeing"),
        ),
      ).toBe(true);
    });

    it("generates positive insight for high avg word count >= 50", () => {
      const entries = Array.from({ length: 5 }, () =>
        makeEntry({ content: words(60), mood_score: 7 }),
      );
      const result = run(entries);
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(
        positives.some((i) => i.text.includes("evidence-rich")),
      ).toBe(true);
    });

    it("generates positive insight when all staff stable or improving", () => {
      // Single staff member with entries only in second half (no first half to decline from)
      const entries = [
        makeEntry({
          date: dayStr(1),
          content: words(50),
          staff_id: "staff_darren",
        }),
        makeEntry({
          date: dayStr(0),
          content: words(55),
          staff_id: "staff_darren",
        }),
      ];
      const result = run(entries, {
        staff: [{ id: "staff_darren", name: "Darren" }],
      });
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(
        positives.some((i) => i.text.includes("stable or improving")),
      ).toBe(true);
    });
  });

  // ── Oak House full dataset ────────────────────────────────────────────

  describe("Oak House full dataset", () => {
    const oakData = buildOakHouseData();
    const result = run(oakData);

    it("overview has correct total", () => {
      expect(result.overview.total_entries).toBe(25);
    });

    it("has both declining staff alerts", () => {
      const decliningAlerts = result.alerts.filter(
        (a) => a.severity === "low" && a.message.includes("declining"),
      );
      expect(decliningAlerts.length).toBeGreaterThanOrEqual(2);
    });

    it("all staff profiles have valid quality labels", () => {
      const validLabels = ["Excellent", "Good", "Adequate", "Poor"];
      for (const sp of result.staff_profiles) {
        expect(validLabels).toContain(sp.quality_label);
      }
    });

    it("all staff profiles have valid trends", () => {
      const validTrends = ["improving", "stable", "declining"];
      for (const sp of result.staff_profiles) {
        expect(validTrends).toContain(sp.trend);
      }
    });

    it("result includes all expected top-level keys", () => {
      expect(result).toHaveProperty("overview");
      expect(result).toHaveProperty("quality_breakdown");
      expect(result).toHaveProperty("staff_profiles");
      expect(result).toHaveProperty("child_coverage");
      expect(result).toHaveProperty("alerts");
      expect(result).toHaveProperty("insights");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("entries outside 7-day window excluded from recent calculations", () => {
      const entries = [
        makeEntry({ date: "2026-05-10", content: words(50) }), // 15 days ago
      ];
      const result = run(entries);
      expect(result.overview.entries_last_7_days).toBe(0);
      expect(result.overview.total_entries).toBe(1);
    });

    it("staff with entries only in one half get stable trend", () => {
      const entries = [
        makeEntry({
          date: dayStr(0),
          content: words(50),
          staff_id: "staff_darren",
        }),
        makeEntry({
          date: dayStr(1),
          content: words(40),
          staff_id: "staff_darren",
        }),
      ];
      const result = run(entries, {
        staff: [{ id: "staff_darren", name: "Darren" }],
      });
      expect(result.staff_profiles[0].trend).toBe("stable");
    });

    it("mood_score of 0 counts as present", () => {
      const entry = makeEntry({
        content: words(105),
        mood_score: 0,
      });
      const result = run([entry]);
      expect(result.overview.mood_capture_rate).toBe(100);
      expect(result.quality_breakdown.excellent).toBe(1);
    });

    it("uses provided today parameter", () => {
      const customToday = "2026-06-01";
      const entry = makeEntry({ date: "2026-06-01" });
      const result = run([entry], { today: customToday });
      expect(result.overview.children_with_entries_today).toBe(1);
    });
  });
});
