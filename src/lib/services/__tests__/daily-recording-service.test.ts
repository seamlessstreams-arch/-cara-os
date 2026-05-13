// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DAILY RECORDING SERVICE TESTS
// Pure-function tests for recording quality assessment, compliance computation,
// staff profiles, gap identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../daily-recording-service";

const {
  assessRecordQuality,
  computeRecordingCompliance,
  computeStaffRecordingProfile,
  identifyRecordingGaps,
  RECORDING_STANDARDS,
  SHIFT_TIMES,
  QUALITY_INDICATORS,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T12:00:00Z");

/** Build a minimal record input for assessRecordQuality. */
function qualityInput(overrides: Partial<{
  content: string;
  word_count: number;
  mood_observations: string | null;
  behaviour_notes: string | null;
  positive_highlights: string[];
  concerns: string[];
  safeguarding_flags: string[];
}> = {}) {
  return {
    content: overrides.content ?? "",
    word_count: overrides.word_count ?? 0,
    mood_observations: overrides.mood_observations ?? null,
    behaviour_notes: overrides.behaviour_notes ?? null,
    positive_highlights: overrides.positive_highlights ?? [],
    concerns: overrides.concerns ?? [],
    safeguarding_flags: overrides.safeguarding_flags ?? [],
  };
}

/** Build a minimal DailyRecord for compliance / profile / gap tests. */
function dailyRecord(overrides: Partial<{
  id: string;
  home_id: string;
  child_id: string | null;
  record_type: string;
  shift_type: string | null;
  author_id: string;
  content: string;
  word_count: number;
  mentions_children: string[];
  mentions_staff: string[];
  mood_observations: string | null;
  behaviour_notes: string | null;
  medication_notes: string | null;
  safeguarding_flags: string[];
  positive_highlights: string[];
  concerns: string[];
  attachments_count: number;
  signed_off_by: string | null;
  signed_off_at: string | null;
  quality_score: string | null;
  created_at: string;
  updated_at: string;
}> = {}) {
  return {
    id: overrides.id ?? "rec-1",
    home_id: overrides.home_id ?? "home-1",
    child_id: overrides.child_id ?? null,
    record_type: overrides.record_type ?? "daily_log",
    shift_type: overrides.shift_type ?? null,
    author_id: overrides.author_id ?? "staff-1",
    content: overrides.content ?? "Some content here for the daily record.",
    word_count: overrides.word_count ?? 50,
    mentions_children: overrides.mentions_children ?? [],
    mentions_staff: overrides.mentions_staff ?? [],
    mood_observations: overrides.mood_observations ?? null,
    behaviour_notes: overrides.behaviour_notes ?? null,
    medication_notes: overrides.medication_notes ?? null,
    safeguarding_flags: overrides.safeguarding_flags ?? [],
    positive_highlights: overrides.positive_highlights ?? [],
    concerns: overrides.concerns ?? [],
    attachments_count: overrides.attachments_count ?? 0,
    signed_off_by: overrides.signed_off_by ?? null,
    signed_off_at: overrides.signed_off_at ?? null,
    quality_score: overrides.quality_score ?? null,
    created_at: overrides.created_at ?? "2026-06-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-06-01T10:00:00Z",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// ── assessRecordQuality ─────────────────────────────────────────────────

describe("assessRecordQuality", () => {
  it("returns 'excellent' for a fully completed record (score >= 85)", () => {
    const result = assessRecordQuality(qualityInput({
      word_count: 250,
      mood_observations: "Settled and happy throughout the day",
      behaviour_notes: "No behavioural incidents",
      positive_highlights: ["Good engagement in activities"],
      concerns: ["Slight drop in appetite"],
      safeguarding_flags: ["Checked door locks"],
    }));
    expect(result.quality).toBe("excellent");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("returns 'good' for a record scoring >= 65 but < 85", () => {
    // word_count 200 => 40pts, mood => 15pts, behaviour => 15pts = 70pts
    const result = assessRecordQuality(qualityInput({
      word_count: 200,
      mood_observations: "Calm",
      behaviour_notes: "No issues",
    }));
    expect(result.quality).toBe("good");
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThan(85);
  });

  it("returns 'adequate' for a record scoring >= 40 but < 65", () => {
    // word_count 200 => 40pts, nothing else = 40pts
    const result = assessRecordQuality(qualityInput({
      word_count: 200,
    }));
    expect(result.quality).toBe("adequate");
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(65);
  });

  it("returns 'poor' for a record scoring < 40", () => {
    const result = assessRecordQuality(qualityInput({
      word_count: 10,
    }));
    expect(result.quality).toBe("poor");
    expect(result.score).toBeLessThan(40);
  });

  it("calculates word score as min(word_count/200, 1) * 40", () => {
    // 100 words => 100/200 = 0.5 * 40 = 20
    const result = assessRecordQuality(qualityInput({ word_count: 100 }));
    expect(result.score).toBe(Math.round(20));

    // 400 words => capped at 1 * 40 = 40
    const capped = assessRecordQuality(qualityInput({ word_count: 400 }));
    expect(capped.score).toBe(40);
  });

  it("awards +15 for mood_observations", () => {
    const without = assessRecordQuality(qualityInput({ word_count: 0 }));
    const withMood = assessRecordQuality(qualityInput({ word_count: 0, mood_observations: "Fine" }));
    expect(withMood.score - without.score).toBe(15);
  });

  it("awards +15 for behaviour_notes", () => {
    const without = assessRecordQuality(qualityInput({ word_count: 0 }));
    const withBehaviour = assessRecordQuality(qualityInput({ word_count: 0, behaviour_notes: "OK" }));
    expect(withBehaviour.score - without.score).toBe(15);
  });

  it("awards +10 for positive_highlights", () => {
    const without = assessRecordQuality(qualityInput({ word_count: 0 }));
    const withHighlights = assessRecordQuality(qualityInput({
      word_count: 0,
      positive_highlights: ["Good day"],
    }));
    expect(withHighlights.score - without.score).toBe(10);
  });

  it("awards +10 for concerns", () => {
    const without = assessRecordQuality(qualityInput({ word_count: 0 }));
    const withConcerns = assessRecordQuality(qualityInput({
      word_count: 0,
      concerns: ["Appetite low"],
    }));
    expect(withConcerns.score - without.score).toBe(10);
  });

  it("awards +10 for safeguarding_flags", () => {
    const without = assessRecordQuality(qualityInput({ word_count: 0 }));
    const withFlags = assessRecordQuality(qualityInput({
      word_count: 0,
      safeguarding_flags: ["Door check"],
    }));
    expect(withFlags.score - without.score).toBe(10);
  });

  it("generates feedback for missing mood_observations", () => {
    const result = assessRecordQuality(qualityInput());
    expect(result.feedback).toContain("Consider adding mood observations");
  });

  it("generates feedback for missing behaviour_notes", () => {
    const result = assessRecordQuality(qualityInput());
    expect(result.feedback).toContain("Consider adding behaviour notes");
  });

  it("generates feedback for missing positive_highlights", () => {
    const result = assessRecordQuality(qualityInput());
    expect(result.feedback).toContain("Include positive highlights to balance the record");
  });

  it("generates feedback for missing concerns", () => {
    const result = assessRecordQuality(qualityInput());
    expect(result.feedback).toContain("Document any concerns, or note that there are none");
  });

  it("generates feedback for missing safeguarding_flags", () => {
    const result = assessRecordQuality(qualityInput());
    expect(result.feedback).toContain("Consider whether any safeguarding observations apply");
  });

  it("generates feedback when below minimum word count", () => {
    const result = assessRecordQuality(qualityInput({ word_count: 30 }));
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`below minimum word count (${RECORDING_STANDARDS.min_word_count} words)`),
      ]),
    );
  });

  it("generates feedback suggesting target word count when between min and target", () => {
    const result = assessRecordQuality(qualityInput({ word_count: 80 }));
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`at least ${RECORDING_STANDARDS.target_word_count} words`),
      ]),
    );
  });

  it("returns no word count feedback when at or above target", () => {
    const result = assessRecordQuality(qualityInput({
      word_count: 200,
      mood_observations: "OK",
      behaviour_notes: "OK",
      positive_highlights: ["OK"],
      concerns: ["OK"],
      safeguarding_flags: ["OK"],
    }));
    const wordFeedback = result.feedback.filter(
      (f) => f.includes("word count") || f.includes("expanding"),
    );
    expect(wordFeedback).toHaveLength(0);
  });

  it("rounds the final score", () => {
    // 75 words => 75/200 = 0.375 * 40 = 15.0 exactly, so still integer
    const result = assessRecordQuality(qualityInput({ word_count: 75 }));
    expect(result.score).toBe(Math.round(result.score));
  });
});

// ── computeRecordingCompliance ──────────────────────────────────────────

describe("computeRecordingCompliance", () => {
  it("returns 100% compliance and zero counts for empty inputs", () => {
    const result = computeRecordingCompliance([], [], NOW);
    expect(result.total_expected).toBe(0);
    expect(result.total_submitted).toBe(0);
    expect(result.missing).toBe(0);
    expect(result.late_submissions).toBe(0);
    expect(result.compliance_percentage).toBe(100);
    expect(result.average_quality_score).toBe(0);
  });

  it("returns 100% compliance when all expected records are submitted", () => {
    const expected = [
      { date: "2026-06-01", shift: "early" as const },
      { date: "2026-06-01", shift: "late" as const },
    ];
    const records = [
      dailyRecord({ shift_type: "early", word_count: 200, created_at: "2026-06-01T15:00:00Z" }),
      dailyRecord({ id: "rec-2", shift_type: "late", word_count: 200, created_at: "2026-06-01T22:30:00Z" }),
    ];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.total_expected).toBe(2);
    expect(result.total_submitted).toBe(2);
    expect(result.missing).toBe(0);
    expect(result.compliance_percentage).toBe(100);
  });

  it("counts missing records when fewer submitted than expected", () => {
    const expected = [
      { date: "2026-06-01", shift: "early" as const },
      { date: "2026-06-01", shift: "late" as const },
      { date: "2026-06-01", shift: "waking_night" as const },
    ];
    const records = [
      dailyRecord({ shift_type: "early", created_at: "2026-06-01T10:00:00Z" }),
    ];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.missing).toBe(2);
    expect(result.compliance_percentage).toBe(33); // Math.round(1/3 * 100)
  });

  it("detects late submissions for day shifts (>2h after shift end)", () => {
    // Early shift ends at 14:30. Deadline is 16:30. Record at 17:00 is late.
    const records = [
      dailyRecord({
        shift_type: "early",
        created_at: "2026-06-01T17:00:00Z",
      }),
    ];
    const expected = [{ date: "2026-06-01", shift: "early" as const }];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.late_submissions).toBe(1);
  });

  it("does not flag on-time submissions as late", () => {
    // Early shift ends at 14:30. Deadline is 16:30. Record at 15:00 is on time.
    const records = [
      dailyRecord({
        shift_type: "early",
        created_at: "2026-06-01T15:00:00Z",
      }),
    ];
    const expected = [{ date: "2026-06-01", shift: "early" as const }];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.late_submissions).toBe(0);
  });

  it("handles overnight shift late submission detection", () => {
    // Waking night ends at 07:00 *next day*. Deadline is 09:00 next day.
    // Record at 10:00 next day is late.
    const records = [
      dailyRecord({
        shift_type: "waking_night",
        created_at: "2026-06-01T10:00:00Z", // date in created_at is June 1
      }),
    ];
    const expected = [{ date: "2026-06-01", shift: "waking_night" as const }];
    const result = computeRecordingCompliance(records, expected, NOW);
    // Shift end for waking_night: 2026-06-01 07:00 + 1 day = 2026-06-02 07:00
    // Deadline: 2026-06-02 09:00. Record at 2026-06-01 10:00 is before deadline.
    expect(result.late_submissions).toBe(0);
  });

  it("computes quality_breakdown across records", () => {
    const records = [
      dailyRecord({
        id: "r1",
        word_count: 250,
        mood_observations: "Good",
        behaviour_notes: "Fine",
        positive_highlights: ["Yes"],
        concerns: ["None"],
        safeguarding_flags: ["Checked"],
      }),
      dailyRecord({ id: "r2", word_count: 10 }),
    ];
    const expected = [
      { date: "2026-06-01", shift: "early" as const },
      { date: "2026-06-01", shift: "late" as const },
    ];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.quality_breakdown.excellent).toBe(1);
    expect(result.quality_breakdown.poor).toBe(1);
    expect(result.quality_breakdown.missing).toBe(0);
  });

  it("populates missing count in quality_breakdown", () => {
    const expected = [
      { date: "2026-06-01", shift: "early" as const },
      { date: "2026-06-01", shift: "late" as const },
    ];
    const records = [dailyRecord({ word_count: 100 })];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.quality_breakdown.missing).toBe(1);
  });

  it("computes average_quality_score across records", () => {
    const records = [
      dailyRecord({ id: "r1", word_count: 200 }), // score = 40
      dailyRecord({ id: "r2", word_count: 200 }), // score = 40
    ];
    const result = computeRecordingCompliance(records, [], NOW);
    expect(result.average_quality_score).toBe(40);
  });

  it("returns average_quality_score of 0 when no records", () => {
    const result = computeRecordingCompliance([], [{ date: "2026-06-01", shift: "early" as const }], NOW);
    expect(result.average_quality_score).toBe(0);
  });
});

// ── computeStaffRecordingProfile ────────────────────────────────────────

describe("computeStaffRecordingProfile", () => {
  it("returns zeroed profile for empty records", () => {
    const result = computeStaffRecordingProfile([]);
    expect(result).toEqual({
      total_records: 0,
      average_word_count: 0,
      average_quality_score: 0,
      quality_trend: "stable",
      common_gaps: [],
      strengths: [],
    });
  });

  it("computes basic stats for a set of records", () => {
    const records = [
      dailyRecord({ id: "r1", word_count: 100 }),
      dailyRecord({ id: "r2", word_count: 200 }),
    ];
    const result = computeStaffRecordingProfile(records);
    expect(result.total_records).toBe(2);
    expect(result.average_word_count).toBe(150);
    expect(result.average_quality_score).toBeGreaterThan(0);
  });

  it("detects 'improving' trend when recent scores are higher", () => {
    // Need >= 20 records. Previous 10 low-quality, recent 10 high-quality.
    const records = [];
    for (let i = 0; i < 10; i++) {
      records.push(dailyRecord({ id: `low-${i}`, word_count: 20 }));
    }
    for (let i = 0; i < 10; i++) {
      records.push(dailyRecord({
        id: `high-${i}`,
        word_count: 250,
        mood_observations: "Good",
        behaviour_notes: "Fine",
        positive_highlights: ["Yes"],
        concerns: ["Noted"],
        safeguarding_flags: ["Done"],
      }));
    }
    const result = computeStaffRecordingProfile(records);
    expect(result.quality_trend).toBe("improving");
  });

  it("detects 'declining' trend when recent scores are lower", () => {
    const records = [];
    for (let i = 0; i < 10; i++) {
      records.push(dailyRecord({
        id: `high-${i}`,
        word_count: 250,
        mood_observations: "Good",
        behaviour_notes: "Fine",
        positive_highlights: ["Yes"],
        concerns: ["Noted"],
        safeguarding_flags: ["Done"],
      }));
    }
    for (let i = 0; i < 10; i++) {
      records.push(dailyRecord({ id: `low-${i}`, word_count: 20 }));
    }
    const result = computeStaffRecordingProfile(records);
    expect(result.quality_trend).toBe("declining");
  });

  it("returns 'stable' trend when fewer than 20 records", () => {
    const records = [];
    for (let i = 0; i < 15; i++) {
      records.push(dailyRecord({ id: `r-${i}`, word_count: 100 }));
    }
    const result = computeStaffRecordingProfile(records);
    expect(result.quality_trend).toBe("stable");
  });

  it("returns 'stable' trend when scores are similar", () => {
    const records = [];
    for (let i = 0; i < 20; i++) {
      records.push(dailyRecord({ id: `r-${i}`, word_count: 100 }));
    }
    const result = computeStaffRecordingProfile(records);
    expect(result.quality_trend).toBe("stable");
  });

  it("identifies common_gaps when fields are missing in >50% of records", () => {
    // All 4 records missing mood and behaviour (100% missing > 50% threshold)
    const records = [
      dailyRecord({ id: "r1", word_count: 100 }),
      dailyRecord({ id: "r2", word_count: 100 }),
      dailyRecord({ id: "r3", word_count: 100 }),
      dailyRecord({ id: "r4", word_count: 100 }),
    ];
    const result = computeStaffRecordingProfile(records);
    expect(result.common_gaps).toContain("mood_observations");
    expect(result.common_gaps).toContain("behaviour_notes");
    expect(result.common_gaps).toContain("positive_highlights");
    expect(result.common_gaps).toContain("concerns");
    expect(result.common_gaps).toContain("safeguarding_flags");
  });

  it("identifies strengths when fields are present in >=70% of records", () => {
    const records = [];
    for (let i = 0; i < 10; i++) {
      records.push(dailyRecord({
        id: `r-${i}`,
        word_count: 200,
        mood_observations: "OK",
        behaviour_notes: "OK",
        positive_highlights: ["Good"],
        concerns: ["Noted"],
        safeguarding_flags: ["Checked"],
      }));
    }
    const result = computeStaffRecordingProfile(records);
    expect(result.strengths).toContain("mood_observations");
    expect(result.strengths).toContain("behaviour_notes");
    expect(result.strengths).toContain("positive_highlights");
    expect(result.strengths).toContain("concerns");
    expect(result.strengths).toContain("safeguarding_flags");
    expect(result.strengths).toContain("word_count");
  });

  it("does not list word_count as strength when average is below target", () => {
    const records = [
      dailyRecord({ id: "r1", word_count: 50 }),
      dailyRecord({ id: "r2", word_count: 60 }),
    ];
    const result = computeStaffRecordingProfile(records);
    expect(result.strengths).not.toContain("word_count");
  });
});

// ── identifyRecordingGaps ───────────────────────────────────────────────

describe("identifyRecordingGaps", () => {
  const dateRange = { start: "2026-06-01", end: "2026-06-03" };

  it("returns no gaps when all children mentioned and all dates covered", () => {
    const childIds = ["c1"];
    const records = [
      dailyRecord({ id: "r1", mentions_children: ["c1"], created_at: "2026-06-01T10:00:00Z", shift_type: "early" }),
      dailyRecord({ id: "r2", mentions_children: ["c1"], created_at: "2026-06-01T18:00:00Z", shift_type: "late" }),
      dailyRecord({ id: "r3", mentions_children: ["c1"], created_at: "2026-06-01T23:00:00Z", shift_type: "waking_night" }),
      dailyRecord({ id: "r4", mentions_children: ["c1"], created_at: "2026-06-02T10:00:00Z", shift_type: "early" }),
      dailyRecord({ id: "r5", mentions_children: ["c1"], created_at: "2026-06-02T18:00:00Z", shift_type: "late" }),
      dailyRecord({ id: "r6", mentions_children: ["c1"], created_at: "2026-06-02T23:00:00Z", shift_type: "waking_night" }),
      dailyRecord({ id: "r7", mentions_children: ["c1"], created_at: "2026-06-03T10:00:00Z", shift_type: "early" }),
      dailyRecord({ id: "r8", mentions_children: ["c1"], created_at: "2026-06-03T18:00:00Z", shift_type: "late" }),
      dailyRecord({ id: "r9", mentions_children: ["c1"], created_at: "2026-06-03T23:00:00Z", shift_type: "waking_night" }),
    ];
    const result = identifyRecordingGaps(records, childIds, dateRange);
    expect(result.children_not_mentioned).toHaveLength(0);
    expect(result.low_mention_children).toHaveLength(0);
    expect(result.days_without_records).toHaveLength(0);
    expect(result.shifts_without_records).toHaveLength(0);
  });

  it("detects children_not_mentioned", () => {
    const childIds = ["c1", "c2", "c3"];
    const records = [
      dailyRecord({ mentions_children: ["c1"], created_at: "2026-06-01T10:00:00Z" }),
    ];
    const result = identifyRecordingGaps(records, childIds, dateRange);
    expect(result.children_not_mentioned).toContain("c2");
    expect(result.children_not_mentioned).toContain("c3");
    expect(result.children_not_mentioned).not.toContain("c1");
  });

  it("counts child_id field references toward mention count", () => {
    const childIds = ["c1"];
    const records = [
      dailyRecord({ child_id: "c1", mentions_children: [], created_at: "2026-06-01T10:00:00Z" }),
      dailyRecord({ child_id: "c1", mentions_children: [], created_at: "2026-06-02T10:00:00Z" }),
      dailyRecord({ child_id: "c1", mentions_children: [], created_at: "2026-06-03T10:00:00Z" }),
    ];
    const result = identifyRecordingGaps(records, childIds, dateRange);
    // 3 mentions via child_id, so not low-mention
    expect(result.children_not_mentioned).not.toContain("c1");
    expect(result.low_mention_children.find((c) => c.child_id === "c1")).toBeUndefined();
  });

  it("detects low_mention_children (1-2 mentions)", () => {
    const childIds = ["c1", "c2"];
    const records = [
      dailyRecord({ mentions_children: ["c1"], created_at: "2026-06-01T10:00:00Z" }),
      dailyRecord({ mentions_children: ["c2"], created_at: "2026-06-01T10:00:00Z" }),
      dailyRecord({ mentions_children: ["c2"], created_at: "2026-06-02T10:00:00Z" }),
      dailyRecord({ mentions_children: ["c2"], created_at: "2026-06-03T10:00:00Z" }),
    ];
    const result = identifyRecordingGaps(records, childIds, dateRange);
    expect(result.low_mention_children).toEqual(
      expect.arrayContaining([{ child_id: "c1", mentions: 1 }]),
    );
    // c2 has 3 mentions — not low
    expect(result.low_mention_children.find((c) => c.child_id === "c2")).toBeUndefined();
  });

  it("detects days_without_records", () => {
    const records = [
      dailyRecord({ created_at: "2026-06-01T10:00:00Z" }),
      // No records for June 2 or 3
    ];
    const result = identifyRecordingGaps(records, [], dateRange);
    expect(result.days_without_records).toContain("2026-06-02");
    expect(result.days_without_records).toContain("2026-06-03");
    expect(result.days_without_records).not.toContain("2026-06-01");
  });

  it("detects shifts_without_records for each day", () => {
    // Only early shift on day 1, nothing else
    const records = [
      dailyRecord({ created_at: "2026-06-01T10:00:00Z", shift_type: "early" }),
    ];
    const result = identifyRecordingGaps(records, [], { start: "2026-06-01", end: "2026-06-01" });
    // Should be missing late and waking_night for June 1
    expect(result.shifts_without_records).toEqual(
      expect.arrayContaining([
        { date: "2026-06-01", shift: "late" },
        { date: "2026-06-01", shift: "waking_night" },
      ]),
    );
    expect(result.shifts_without_records).not.toEqual(
      expect.arrayContaining([{ date: "2026-06-01", shift: "early" }]),
    );
  });

  it("returns empty arrays when no records and no children", () => {
    const result = identifyRecordingGaps([], [], { start: "2026-06-01", end: "2026-06-01" });
    expect(result.children_not_mentioned).toHaveLength(0);
    expect(result.low_mention_children).toHaveLength(0);
    expect(result.days_without_records).toEqual(["2026-06-01"]);
    // Shifts still expected for each day even with no records
    expect(result.shifts_without_records).toHaveLength(3); // early, late, waking_night
  });
});

// ── RECORDING_STANDARDS ─────────────────────────────────────────────────

describe("RECORDING_STANDARDS", () => {
  it("has min_word_count of 50", () => {
    expect(RECORDING_STANDARDS.min_word_count).toBe(50);
  });

  it("has target_word_count of 150", () => {
    expect(RECORDING_STANDARDS.target_word_count).toBe(150);
  });

  it("requires content and mood_observations", () => {
    expect(RECORDING_STANDARDS.required_fields).toEqual(["content", "mood_observations"]);
  });

  it("has max_hours_after_shift of 2", () => {
    expect(RECORDING_STANDARDS.max_hours_after_shift).toBe(2);
  });

  it("has children_per_shift_minimum of 1", () => {
    expect(RECORDING_STANDARDS.children_per_shift_minimum).toBe(1);
  });
});

// ── SHIFT_TIMES ─────────────────────────────────────────────────────────

describe("SHIFT_TIMES", () => {
  it("has exactly 5 entries", () => {
    expect(Object.keys(SHIFT_TIMES)).toHaveLength(5);
  });

  it("contains early, late, long_day, waking_night, sleep_in", () => {
    expect(Object.keys(SHIFT_TIMES)).toEqual(
      expect.arrayContaining(["early", "late", "long_day", "waking_night", "sleep_in"]),
    );
  });

  it("each entry has start, end, and label", () => {
    for (const [key, value] of Object.entries(SHIFT_TIMES)) {
      expect(value).toHaveProperty("start");
      expect(value).toHaveProperty("end");
      expect(value).toHaveProperty("label");
      expect(typeof value.start).toBe("string");
      expect(typeof value.end).toBe("string");
      expect(typeof value.label).toBe("string");
      // Verify time format HH:MM
      expect(value.start).toMatch(/^\d{2}:\d{2}$/);
      expect(value.end).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("early shift runs 07:00 to 14:30", () => {
    expect(SHIFT_TIMES.early).toEqual({ start: "07:00", end: "14:30", label: "Early Shift" });
  });

  it("waking_night shift runs 22:00 to 07:00", () => {
    expect(SHIFT_TIMES.waking_night).toEqual({ start: "22:00", end: "07:00", label: "Waking Night" });
  });
});

// ── QUALITY_INDICATORS ──────────────────────────────────────────────────

describe("QUALITY_INDICATORS", () => {
  it("has all 5 quality levels", () => {
    const levels: string[] = ["excellent", "good", "adequate", "poor", "missing"];
    for (const level of levels) {
      expect(QUALITY_INDICATORS).toHaveProperty(level);
      expect(typeof (QUALITY_INDICATORS as Record<string, string>)[level]).toBe("string");
    }
  });

  it("has exactly 5 entries", () => {
    expect(Object.keys(QUALITY_INDICATORS)).toHaveLength(5);
  });
});
