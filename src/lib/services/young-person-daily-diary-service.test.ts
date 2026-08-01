import { describe, it, expect } from "vitest";
import {
  computeDailyDiaryMetrics,
  identifyDailyDiaryAlerts,
  type YoungPersonDailyDiaryRecord,
} from "./young-person-daily-diary-service";

// ── Factory ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<YoungPersonDailyDiaryRecord> = {}): YoungPersonDailyDiaryRecord {
  return {
    id: "dd-1",
    home_id: "home-1",
    child_name: "Alex Green",
    child_id: "child-1",
    mood_rating: "happy",
    day_rating: "good",
    entry_type: "daily_reflection",
    privacy_level: "share_with_keyworker",
    session_date: "2025-05-10",
    recorded_by: "staff-1",
    diary_entry: "Had a good day.",
    best_part_of_day: "Football",
    worst_part_of_day: null,
    what_i_wish: null,
    what_helped_me: null,
    what_i_need: null,
    who_i_spoke_to: null,
    staff_response: null,
    keyworker_notes: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    child_wrote_themselves: true,
    child_chose_to_share: true,
    staff_supported_writing: false,
    feelings_explored: true,
    wishes_recorded: true,
    concerns_addressed: true,
    keyworker_read: true,
    responded_to: true,
    linked_to_care_plan: true,
    safeguarding_checked: true,
    privacy_respected: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2025-05-10T00:00:00Z",
    updated_at: "2025-05-10T00:00:00Z",
    ...overrides,
  };
}

// ── computeDailyDiaryMetrics ───────────────────────────────────────────────

describe("computeDailyDiaryMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeDailyDiaryMetrics([]);
    expect(m.total_entries).toBe(0);
    expect(m.sad_entries_count).toBe(0);
    expect(m.difficult_day_count).toBe(0);
    expect(m.self_written_count).toBe(0);
    expect(m.concern_count).toBe(0);
    expect(m.child_wrote_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts sad entries (sad, very_sad, angry, anxious)", () => {
    const records = [
      makeRecord({ mood_rating: "sad" }),
      makeRecord({ id: "d2", mood_rating: "very_sad" }),
      makeRecord({ id: "d3", mood_rating: "angry" }),
      makeRecord({ id: "d4", mood_rating: "anxious" }),
      makeRecord({ id: "d5", mood_rating: "happy" }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.sad_entries_count).toBe(4);
  });

  it("counts difficult days (difficult + terrible)", () => {
    const records = [
      makeRecord({ day_rating: "difficult" }),
      makeRecord({ id: "d2", day_rating: "terrible" }),
      makeRecord({ id: "d3", day_rating: "good" }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.difficult_day_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ child_wrote_themselves: true }),
      makeRecord({ id: "d2", child_wrote_themselves: false }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.child_wrote_rate).toBe(50);
  });

  it("counts unique children by name", () => {
    const records = [
      makeRecord({ child_name: "Alex" }),
      makeRecord({ id: "d2", child_name: "Alex" }),
      makeRecord({ id: "d3", child_name: "Jordan" }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown records by mood, day, type, privacy", () => {
    const records = [
      makeRecord({ mood_rating: "happy", day_rating: "good", entry_type: "daily_reflection", privacy_level: "share_with_keyworker" }),
      makeRecord({ id: "d2", mood_rating: "sad", day_rating: "difficult", entry_type: "concern_raised", privacy_level: "private_to_me" }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.by_mood_rating).toEqual({ happy: 1, sad: 1 });
    expect(m.by_day_rating).toEqual({ good: 1, difficult: 1 });
    expect(m.by_entry_type).toEqual({ daily_reflection: 1, concern_raised: 1 });
    expect(m.by_privacy_level).toEqual({ share_with_keyworker: 1, private_to_me: 1 });
  });

  it("concern_count counts concern_raised entry types", () => {
    const records = [
      makeRecord({ entry_type: "concern_raised" }),
      makeRecord({ id: "d2", entry_type: "concern_raised" }),
      makeRecord({ id: "d3", entry_type: "daily_reflection" }),
    ];
    const m = computeDailyDiaryMetrics(records);
    expect(m.concern_count).toBe(2);
  });
});

// ── identifyDailyDiaryAlerts ───────────────────────────────────────────────

describe("identifyDailyDiaryAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyDailyDiaryAlerts([])).toEqual([]);
  });

  it("flags critical when concern_raised and not addressed", () => {
    const records = [makeRecord({ entry_type: "concern_raised", concerns_addressed: false })];
    const alerts = identifyDailyDiaryAlerts(records);
    const concern = alerts.filter((a) => a.type === "concern_not_addressed");
    expect(concern.length).toBe(1);
    expect(concern[0].severity).toBe("critical");
  });

  it("does NOT flag concern when concerns_addressed is true", () => {
    const records = [makeRecord({ entry_type: "concern_raised", concerns_addressed: true })];
    const alerts = identifyDailyDiaryAlerts(records);
    const concern = alerts.filter((a) => a.type === "concern_not_addressed");
    expect(concern.length).toBe(0);
  });

  it("flags high when any entries not responded to (threshold 1)", () => {
    const records = [makeRecord({ responded_to: false })];
    const alerts = identifyDailyDiaryAlerts(records);
    const nr = alerts.filter((a) => a.type === "not_responded_to");
    expect(nr.length).toBe(1);
    expect(nr[0].severity).toBe("high");
  });

  it("flags high when privacy not respected (threshold 1)", () => {
    const records = [makeRecord({ privacy_respected: false })];
    const alerts = identifyDailyDiaryAlerts(records);
    const priv = alerts.filter((a) => a.type === "privacy_not_respected");
    expect(priv.length).toBe(1);
    expect(priv[0].severity).toBe("high");
  });

  it("flags medium for feelings not explored when count >= 2", () => {
    const records = [
      makeRecord({ feelings_explored: false }),
      makeRecord({ id: "d2", feelings_explored: false }),
    ];
    const alerts = identifyDailyDiaryAlerts(records);
    const feel = alerts.filter((a) => a.type === "no_feelings_explored");
    expect(feel.length).toBe(1);
    expect(feel[0].severity).toBe("medium");
  });

  it("does NOT flag feelings not explored when only 1", () => {
    const records = [makeRecord({ feelings_explored: false })];
    const alerts = identifyDailyDiaryAlerts(records);
    const feel = alerts.filter((a) => a.type === "no_feelings_explored");
    expect(feel.length).toBe(0);
  });

  it("flags medium for keyworker not read when count >= 2", () => {
    const records = [
      makeRecord({ keyworker_read: false }),
      makeRecord({ id: "d2", keyworker_read: false }),
    ];
    const alerts = identifyDailyDiaryAlerts(records);
    const kw = alerts.filter((a) => a.type === "keyworker_not_read");
    expect(kw.length).toBe(1);
    expect(kw[0].severity).toBe("medium");
  });
});
