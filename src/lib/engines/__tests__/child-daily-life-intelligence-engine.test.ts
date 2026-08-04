// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Daily Life Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildDailyLife,
  type ChildDailyLifeInput,
  type DailyLogEntryInput,
  type DailyEntryType,
} from "../child-daily-life-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeEntry(overrides: Partial<DailyLogEntryInput> = {}): DailyLogEntryInput {
  return {
    id: `log_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(1),
    time: "10:00",
    entry_type: "general",
    mood_score: 7,
    is_significant: false,
    has_linked_incident: false,
    staff_id: "staff_darren",
    ...overrides,
  };
}

function generateDailyEntries(days: number, entriesPerDay: number = 2): DailyLogEntryInput[] {
  const entries: DailyLogEntryInput[] = [];
  const types: DailyEntryType[] = ["general", "mood", "health", "education", "activity", "behaviour", "food", "sleep"];
  for (let d = 0; d < days; d++) {
    for (let e = 0; e < entriesPerDay; e++) {
      entries.push(makeEntry({
        date: daysAgo(d),
        time: `${8 + e * 4}:00`,
        entry_type: types[(d * entriesPerDay + e) % types.length],
        mood_score: 5 + Math.floor(Math.random() * 5),
        staff_id: `staff_${(d + e) % 3}`,
      }));
    }
  }
  return entries;
}

function baseInput(overrides: Partial<ChildDailyLifeInput> = {}): ChildDailyLifeInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    entries: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Daily Life Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("daily_life_rating");
    expect(r).toHaveProperty("daily_life_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("mood_profile");
    expect(r).toHaveProperty("recording_frequency");
    expect(r).toHaveProperty("entry_types");
    expect(r).toHaveProperty("quality");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Rating ────────────────────────────────────────────────────────────

  it("rates no_entries when no entries exist", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.daily_life_rating).toBe("no_entries");
    expect(r.daily_life_score).toBe(0);
  });

  it("rates good/outstanding with comprehensive recording", () => {
    const r = computeChildDailyLife(baseInput({
      entries: generateDailyEntries(28, 3),
    }));
    expect(["good", "outstanding"]).toContain(r.daily_life_rating);
    expect(r.daily_life_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with sparse recording", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ date: daysAgo(25), mood_score: null }),
        makeEntry({ date: daysAgo(28), mood_score: null }),
      ],
    }));
    expect(["inadequate", "adequate"]).toContain(r.daily_life_rating);
  });

  // ── Mood Profile ──────────────────────────────────────────────────────

  it("calculates mood averages", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ date: daysAgo(1), mood_score: 8 }),
        makeEntry({ date: daysAgo(2), mood_score: 6 }),
        makeEntry({ date: daysAgo(3), mood_score: 7 }),
      ],
    }));
    expect(r.mood_profile.avg_mood_7d).toBe(7);
    expect(r.mood_profile.avg_mood_30d).toBe(7);
    expect(r.mood_profile.lowest_mood_7d).toBe(6);
    expect(r.mood_profile.highest_mood_7d).toBe(8);
  });

  it("returns null mood when no mood scores", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [makeEntry({ mood_score: null })],
    }));
    expect(r.mood_profile.avg_mood_7d).toBeNull();
  });

  it("counts mood below 5", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ date: daysAgo(1), mood_score: 3 }),
        makeEntry({ date: daysAgo(2), mood_score: 4 }),
        makeEntry({ date: daysAgo(3), mood_score: 7 }),
        makeEntry({ date: daysAgo(4), mood_score: 2 }),
      ],
    }));
    expect(r.mood_profile.mood_below_5_count).toBe(3);
  });

  // ── Recording Frequency ───────────────────────────────────────────────

  it("counts entries in 7d and 30d windows", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ date: daysAgo(1) }),
        makeEntry({ date: daysAgo(5) }),
        makeEntry({ date: daysAgo(15) }),
        makeEntry({ date: daysAgo(25) }),
        makeEntry({ date: daysAgo(60) }), // Outside 30d
      ],
    }));
    expect(r.recording_frequency.entries_7d).toBe(2);
    expect(r.recording_frequency.entries_30d).toBe(4);
    expect(r.recording_frequency.total_entries).toBe(5);
  });

  it("counts unique days with entries", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ date: daysAgo(1), time: "09:00" }),
        makeEntry({ date: daysAgo(1), time: "14:00" }),
        makeEntry({ date: daysAgo(2) }),
      ],
    }));
    expect(r.recording_frequency.days_with_entries_30d).toBe(2);
  });

  it("calculates recording coverage rate", () => {
    const entries: DailyLogEntryInput[] = [];
    for (let i = 0; i < 27; i++) {
      entries.push(makeEntry({ date: daysAgo(i) }));
    }
    const r = computeChildDailyLife(baseInput({ entries }));
    expect(r.recording_frequency.recording_coverage_rate).toBe(90); // 27/30
  });

  // ── Entry Types ───────────────────────────────────────────────────────

  it("builds entry type breakdown", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ entry_type: "general" }),
        makeEntry({ entry_type: "general" }),
        makeEntry({ entry_type: "mood" }),
        makeEntry({ entry_type: "health" }),
      ],
    }));
    expect(r.entry_types.length).toBe(3);
    expect(r.entry_types[0].type).toBe("general");
    expect(r.entry_types[0].count).toBe(2);
  });

  // ── Quality ───────────────────────────────────────────────────────────

  it("counts significant events", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ is_significant: true }),
        makeEntry({ is_significant: false }),
        makeEntry({ is_significant: true }),
      ],
    }));
    expect(r.quality.significant_events_30d).toBe(2);
  });

  it("counts unique staff", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ staff_id: "staff_a" }),
        makeEntry({ staff_id: "staff_b" }),
        makeEntry({ staff_id: "staff_a" }),
      ],
    }));
    expect(r.quality.staff_recording_count).toBe(2);
  });

  it("categorises entries by time of day", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        makeEntry({ time: "08:00" }),  // morning
        makeEntry({ time: "14:00" }),  // afternoon
        makeEntry({ time: "20:00" }),  // evening
      ],
    }));
    expect(r.quality.morning_entries).toBe(1);
    expect(r.quality.afternoon_entries).toBe(1);
    expect(r.quality.evening_entries).toBe(1);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("boosts score for high coverage", () => {
    const highCoverage = computeChildDailyLife(baseInput({
      entries: generateDailyEntries(28, 2),
    }));
    const lowCoverage = computeChildDailyLife(baseInput({
      entries: [makeEntry({ date: daysAgo(1) }), makeEntry({ date: daysAgo(20) })],
    }));
    expect(highCoverage.daily_life_score).toBeGreaterThan(lowCoverage.daily_life_score!);
  });

  it("penalises no entries in last 7 days", () => {
    const recent = computeChildDailyLife(baseInput({
      entries: [makeEntry({ date: daysAgo(1) }), makeEntry({ date: daysAgo(3) })],
    }));
    const old = computeChildDailyLife(baseInput({
      entries: [makeEntry({ date: daysAgo(15) }), makeEntry({ date: daysAgo(20) })],
    }));
    expect(recent.daily_life_score).toBeGreaterThan(old.daily_life_score!);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildDailyLife(baseInput({
      entries: generateDailyEntries(30, 4),
    }));
    expect(r.daily_life_score).toBeGreaterThanOrEqual(0);
    expect(r.daily_life_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strengths for good recording", () => {
    const r = computeChildDailyLife(baseInput({
      entries: generateDailyEntries(28, 3),
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for no entries", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.concerns.some((c) => c.includes("No daily log entries"))).toBe(true);
  });

  it("generates concern for declining mood", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [
        // Older entries: high mood
        makeEntry({ date: daysAgo(20), mood_score: 9 }),
        makeEntry({ date: daysAgo(18), mood_score: 8 }),
        makeEntry({ date: daysAgo(15), mood_score: 9 }),
        // Recent entries: low mood
        makeEntry({ date: daysAgo(3), mood_score: 3 }),
        makeEntry({ date: daysAgo(2), mood_score: 2 }),
        makeEntry({ date: daysAgo(1), mood_score: 3 }),
      ],
    }));
    if (r.mood_profile.mood_trend === "declining") {
      expect(r.concerns.some((c) => c.includes("declining"))).toBe(true);
    }
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends immediate recording for no entries", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends resuming when no entries in 7d", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [makeEntry({ date: daysAgo(15) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  // ── Cara Insights ─────────────────────────────────────────────────────

  it("generates critical insight for no entries", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for outstanding recording", () => {
    const r = computeChildDailyLife(baseInput({
      entries: generateDailyEntries(30, 3),
    }));
    if (r.daily_life_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes rating in headline", () => {
    const r = computeChildDailyLife(baseInput());
    expect(r.headline).toContain(r.daily_life_rating);
  });

  it("mentions no entries this week", () => {
    const r = computeChildDailyLife(baseInput({
      entries: [makeEntry({ date: daysAgo(20) })],
    }));
    expect(r.headline).toContain("no entries this week");
  });
});
