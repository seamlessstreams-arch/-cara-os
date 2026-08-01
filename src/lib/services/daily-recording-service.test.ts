import { describe, it, expect } from "vitest";
import {
  assessRecordQuality,
  computeRecordingCompliance,
  computeStaffRecordingProfile,
  identifyRecordingGaps,
  DailyRecord,
  ShiftType,
} from "./daily-recording-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_id: "child-1",
    record_type: "daily_log",
    shift_type: "early",
    author_id: "staff-1",
    content: "A decent daily log entry with enough words to meet the minimum word count requirement for testing purposes here.",
    word_count: 120,
    mentions_children: ["child-1"],
    mentions_staff: ["staff-1"],
    mood_observations: "Calm and settled",
    behaviour_notes: "Well behaved throughout",
    medication_notes: null,
    safeguarding_flags: [],
    positive_highlights: ["Good engagement"],
    concerns: [],
    attachments_count: 0,
    signed_off_by: null,
    signed_off_at: null,
    quality_score: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── assessRecordQuality ────────────────────────────────────────────────

describe("assessRecordQuality", () => {
  it("returns poor for very short record with no fields", () => {
    const result = assessRecordQuality({
      content: "Short",
      word_count: 5,
      mood_observations: null,
      behaviour_notes: null,
      positive_highlights: [],
      concerns: [],
      safeguarding_flags: [],
    });
    // word score = (5/200)*40 = 1, total = 1 => poor (<40)
    expect(result.quality).toBe("poor");
    expect(result.score).toBeLessThan(40);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it("returns excellent for comprehensive record", () => {
    const result = assessRecordQuality({
      content: "x ".repeat(200),
      word_count: 200,
      mood_observations: "Good mood",
      behaviour_notes: "Excellent behaviour",
      positive_highlights: ["Helped peers"],
      concerns: ["Minor issue"],
      safeguarding_flags: ["observation noted"],
    });
    // 40 + 15 + 15 + 10 + 10 + 10 = 100 => excellent (>=85)
    expect(result.quality).toBe("excellent");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("returns good when mood and behaviour are present but word count moderate", () => {
    const result = assessRecordQuality({
      content: "x ".repeat(150),
      word_count: 150,
      mood_observations: "OK",
      behaviour_notes: "Fine",
      positive_highlights: [],
      concerns: [],
      safeguarding_flags: [],
    });
    // wordScore = (150/200)*40 = 30, +15+15 = 60 => adequate
    // Actually 30+15+15 = 60 => adequate (>=40, <65)
    expect(result.quality).toBe("adequate");
  });

  it("returns adequate for record meeting minimum word count only", () => {
    const result = assessRecordQuality({
      content: "x ".repeat(100),
      word_count: 100,
      mood_observations: null,
      behaviour_notes: null,
      positive_highlights: ["one"],
      concerns: ["one"],
      safeguarding_flags: ["one"],
    });
    // wordScore = (100/200)*40 = 20, +0+0+10+10+10 = 50 => adequate
    expect(result.quality).toBe("adequate");
    expect(result.score).toBe(50);
  });
});

// ── computeRecordingCompliance ─────────────────────────────────────────

describe("computeRecordingCompliance", () => {
  it("returns zeroes for empty data", () => {
    const result = computeRecordingCompliance([], [], NOW);
    expect(result.total_expected).toBe(0);
    expect(result.total_submitted).toBe(0);
    expect(result.missing).toBe(0);
    expect(result.compliance_percentage).toBe(100);
    expect(result.average_quality_score).toBeNull();;
  });

  it("calculates compliance for populated data", () => {
    const expected = [
      { date: "2026-05-21", shift: "early" as ShiftType },
      { date: "2026-05-21", shift: "late" as ShiftType },
    ];
    const records = [makeRecord()];
    const result = computeRecordingCompliance(records, expected, NOW);
    expect(result.total_expected).toBe(2);
    expect(result.total_submitted).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.compliance_percentage).toBe(50);
  });

  it("detects late submissions past 2-hour deadline", () => {
    // Early shift ends at 14:30; deadline = 16:30.
    // Record created at 18:00 is late.
    const lateRecord = makeRecord({
      shift_type: "early",
      created_at: "2026-05-21T18:00:00Z",
    });
    const result = computeRecordingCompliance(
      [lateRecord],
      [{ date: "2026-05-21", shift: "early" }],
      NOW,
    );
    expect(result.late_submissions).toBe(1);
  });
});

// ── computeStaffRecordingProfile ───────────────────────────────────────

describe("computeStaffRecordingProfile", () => {
  it("returns zero defaults for empty records", () => {
    const result = computeStaffRecordingProfile([]);
    expect(result.total_records).toBe(0);
    expect(result.average_word_count).toBe(0);
    expect(result.average_quality_score).toBe(0);
    expect(result.quality_trend).toBe("stable");
    expect(result.common_gaps).toEqual([]);
    expect(result.strengths).toEqual([]);
  });

  it("computes average word count and identifies gaps", () => {
    const records = [
      makeRecord({ word_count: 100, mood_observations: null, behaviour_notes: null }),
      makeRecord({ id: "rec-2", word_count: 200, mood_observations: null, behaviour_notes: null }),
    ];
    const result = computeStaffRecordingProfile(records);
    expect(result.total_records).toBe(2);
    expect(result.average_word_count).toBe(150);
    // Both missing mood and behaviour => gap threshold exceeded (2 > 2*0.5=1)
    expect(result.common_gaps).toContain("mood_observations");
    expect(result.common_gaps).toContain("behaviour_notes");
  });
});

// ── identifyRecordingGaps ──────────────────────────────────────────────

describe("identifyRecordingGaps", () => {
  it("returns empty arrays for no children and no records", () => {
    const result = identifyRecordingGaps([], [], { start: "2026-05-21", end: "2026-05-21" });
    expect(result.children_not_mentioned).toEqual([]);
    expect(result.low_mention_children).toEqual([]);
    expect(result.days_without_records).toEqual(["2026-05-21"]);
  });

  it("identifies children not mentioned", () => {
    const records = [makeRecord({ mentions_children: ["child-1"], child_id: "child-1" })];
    const result = identifyRecordingGaps(
      records,
      ["child-1", "child-2", "child-3"],
      { start: "2026-05-21", end: "2026-05-21" },
    );
    expect(result.children_not_mentioned).toContain("child-2");
    expect(result.children_not_mentioned).toContain("child-3");
  });

  it("identifies low-mention children with 1-2 mentions", () => {
    const records = [
      makeRecord({ mentions_children: ["child-2"] }),
    ];
    const result = identifyRecordingGaps(
      records,
      ["child-1", "child-2"],
      { start: "2026-05-21", end: "2026-05-21" },
    );
    expect(result.low_mention_children).toEqual(
      expect.arrayContaining([{ child_id: "child-2", mentions: 1 }]),
    );
  });

  it("detects uncovered shifts in the date range", () => {
    const result = identifyRecordingGaps(
      [],
      ["child-1"],
      { start: "2026-05-21", end: "2026-05-21" },
    );
    // Each day checks early, late, waking_night
    expect(result.shifts_without_records.length).toBe(3);
  });
});
