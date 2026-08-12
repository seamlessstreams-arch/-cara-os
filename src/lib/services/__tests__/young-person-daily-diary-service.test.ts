// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON DAILY DIARY SERVICE TESTS
// Pure-function unit tests for daily diary metrics computation and alert
// identification — mood/day breakdowns, boolean compliance rates, and
// per-record/aggregate alerts.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing, type YoungPersonDailyDiaryRecord } from "../young-person-daily-diary-service";
import { todayStr } from "@/lib/utils";
const { computeDailyDiaryMetrics, identifyDailyDiaryAlerts } = _testing;

const now = new Date(todayStr());

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides?: Partial<YoungPersonDailyDiaryRecord>): YoungPersonDailyDiaryRecord {
  return {
    id: "a-1",
    home_id: "home-1",
    mood_rating: "happy",
    day_rating: "good",
    entry_type: "daily_reflection",
    privacy_level: "share_with_keyworker",
    session_date: now.toISOString(),
    child_name: "Child A",
    recorded_by: "Child A",
    diary_entry: "Today was good",
    best_part_of_day: "Playing football",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    worst_part_of_day: "worst_part_of_day" in (overrides ?? {}) ? (overrides!.worst_part_of_day ?? null) : null,
    what_i_wish: "what_i_wish" in (overrides ?? {}) ? (overrides!.what_i_wish ?? null) : null,
    what_helped_me: "what_helped_me" in (overrides ?? {}) ? (overrides!.what_helped_me ?? null) : null,
    what_i_need: "what_i_need" in (overrides ?? {}) ? (overrides!.what_i_need ?? null) : null,
    who_i_spoke_to: "who_i_spoke_to" in (overrides ?? {}) ? (overrides!.who_i_spoke_to ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    keyworker_notes: "keyworker_notes" in (overrides ?? {}) ? (overrides!.keyworker_notes ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    child_wrote_themselves: true,
    child_chose_to_share: true,
    staff_supported_writing: true,
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
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ── computeDailyDiaryMetrics ──────────────────────────────────────────────

describe("computeDailyDiaryMetrics", () => {
  it("returns zeros for empty", () => { 
    const m = computeDailyDiaryMetrics([]);
    expect(m.total_entries).toBe(0);
    expect(m.sad_entries_count).toBe(0);
    expect(m.difficult_day_count).toBe(0);
    expect(m.self_written_count).toBe(0);
    expect(m.concern_count).toBe(0);
  });

  it("returns empty breakdowns", () => { 
    const m = computeDailyDiaryMetrics([]);
    expect(m.by_mood_rating).toEqual({});
    expect(m.by_day_rating).toEqual({});
    expect(m.by_entry_type).toEqual({});
    expect(m.by_privacy_level).toEqual({});
  });

  it("total_entries counts records", () => { expect(computeDailyDiaryMetrics([makeRecord(), makeRecord({ id: "a-2" })]).total_entries).toBe(2); });

  it("counts sad as sad_entries", () => { expect(computeDailyDiaryMetrics([makeRecord({ mood_rating: "sad" })]).sad_entries_count).toBe(1); });

  it("counts very_sad as sad_entries", () => { expect(computeDailyDiaryMetrics([makeRecord({ mood_rating: "very_sad" })]).sad_entries_count).toBe(1); });

  it("counts angry as sad_entries", () => { expect(computeDailyDiaryMetrics([makeRecord({ mood_rating: "angry" })]).sad_entries_count).toBe(1); });

  it("counts anxious as sad_entries", () => { expect(computeDailyDiaryMetrics([makeRecord({ mood_rating: "anxious" })]).sad_entries_count).toBe(1); });

  it("does not count mixed as sad", () => { expect(computeDailyDiaryMetrics([makeRecord({ mood_rating: "mixed" })]).sad_entries_count).toBe(0); });

  it("counts difficult day", () => { expect(computeDailyDiaryMetrics([makeRecord({ day_rating: "difficult" })]).difficult_day_count).toBe(1); });

  it("counts terrible as difficult", () => { expect(computeDailyDiaryMetrics([makeRecord({ day_rating: "terrible" })]).difficult_day_count).toBe(1); });

  it("does not count okay as difficult", () => { expect(computeDailyDiaryMetrics([makeRecord({ day_rating: "okay" })]).difficult_day_count).toBe(0); });

  it("counts self_written", () => { expect(computeDailyDiaryMetrics([makeRecord({ child_wrote_themselves: true })]).self_written_count).toBe(1); });

  it("counts concern_raised", () => { expect(computeDailyDiaryMetrics([makeRecord({ entry_type: "concern_raised" })]).concern_count).toBe(1); });

  it("returns 100% boolean rates with defaults", () => { 
    const m = computeDailyDiaryMetrics([makeRecord()]);
    expect(m.child_wrote_rate).toBe(100);
    expect(m.child_chose_share_rate).toBe(100);
    expect(m.staff_supported_rate).toBe(100);
    expect(m.feelings_explored_rate).toBe(100);
    expect(m.wishes_recorded_rate).toBe(100);
    expect(m.concerns_addressed_rate).toBe(100);
    expect(m.keyworker_read_rate).toBe(100);
    expect(m.responded_to_rate).toBe(100);
    expect(m.care_plan_linked_rate).toBe(100);
    expect(m.safeguarding_checked_rate).toBe(100);
    expect(m.privacy_respected_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("child_wrote_rate 0 when false", () => { expect(computeDailyDiaryMetrics([makeRecord({ child_wrote_themselves: false })]).child_wrote_rate).toBe(0); });

  it("mixed boolean rate", () => { const m = computeDailyDiaryMetrics([makeRecord(), makeRecord({ id: "a-2", child_wrote_themselves: false }), makeRecord({ id: "a-3", child_wrote_themselves: false })]); expect(m.child_wrote_rate).toBe(33.3); });

  it("unique_children distinct", () => { expect(computeDailyDiaryMetrics([makeRecord({ child_name: "A" }), makeRecord({ id: "a-2", child_name: "B" }), makeRecord({ id: "a-3", child_name: "A" })]).unique_children).toBe(2); });

  it("counts all 10 mood ratings", () => { const moods = ["very_happy", "happy", "okay", "sad", "very_sad", "angry", "anxious", "mixed", "numb", "other"] as const; const recs = moods.map((m, i) => makeRecord({ id: `m-${i}`, mood_rating: m })); const res = computeDailyDiaryMetrics(recs); for (const mood of moods) expect(res.by_mood_rating[mood]).toBe(1); });

  it("counts all 5 day ratings, 10 entry types, 5 privacy levels", () => { const days = ["amazing", "good", "okay", "difficult", "terrible"] as const; const types = ["daily_reflection", "morning_check_in", "evening_check_in", "weekly_reflection", "special_event", "concern_raised", "achievement", "wish_feeling", "complaint", "other"] as const; const privs = ["private_to_me", "share_with_keyworker", "share_with_staff", "share_with_social_worker", "share_with_everyone"] as const; const recs = [...days.map((d, i) => makeRecord({ id: `d-${i}`, day_rating: d })), ...types.map((t, i) => makeRecord({ id: `t-${i}`, entry_type: t })), ...privs.map((p, i) => makeRecord({ id: `p-${i}`, privacy_level: p }))]; const res = computeDailyDiaryMetrics(recs); for (const d of days) expect(res.by_day_rating[d]).toBeGreaterThanOrEqual(1); for (const t of types) expect(res.by_entry_type[t]).toBeGreaterThanOrEqual(1); for (const p of privs) expect(res.by_privacy_level[p]).toBeGreaterThanOrEqual(1); });
});

// ── identifyDailyDiaryAlerts ──────────────────────────────────────────────

describe("identifyDailyDiaryAlerts", () => {
  it("returns empty for clean", () => { expect(identifyDailyDiaryAlerts([makeRecord()])).toEqual([]); });

  it("returns empty for empty", () => { expect(identifyDailyDiaryAlerts([])).toEqual([]); });

  it("fires concern_not_addressed", () => { 
    const a = identifyDailyDiaryAlerts([makeRecord({ entry_type: "concern_raised", concerns_addressed: false })]);
    const c = a.find((x) => x.type === "concern_not_addressed");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
    expect(c!.message).toContain("Child A");
  });

  it("no critical when concern_raised + addressed", () => { const a = identifyDailyDiaryAlerts([makeRecord({ entry_type: "concern_raised", concerns_addressed: true })]); expect(a.find((x) => x.type === "concern_not_addressed")).toBeUndefined(); });

  it("no critical when daily_reflection + not addressed", () => { const a = identifyDailyDiaryAlerts([makeRecord({ entry_type: "daily_reflection", concerns_addressed: false })]); expect(a.find((x) => x.type === "concern_not_addressed")).toBeUndefined(); });

  it("per-record", () => { const a = identifyDailyDiaryAlerts([makeRecord({ id: "c-1", entry_type: "concern_raised", concerns_addressed: false }), makeRecord({ id: "c-2", entry_type: "concern_raised", concerns_addressed: false })]); expect(a.filter((x) => x.type === "concern_not_addressed")).toHaveLength(2); });

  it("fires not_responded_to singular", () => { 
    const a = identifyDailyDiaryAlerts([makeRecord({ responded_to: false })]);
    const n = a.find((x) => x.type === "not_responded_to");
    expect(n).toBeDefined();
    expect(n!.severity).toBe("high");
    expect(n!.message).toContain("1 diary entry has");
  });

  it("not_responded_to plural", () => { const a = identifyDailyDiaryAlerts([makeRecord({ id: "r-1", responded_to: false }), makeRecord({ id: "r-2", responded_to: false })]); const n = a.find((x) => x.type === "not_responded_to"); expect(n!.message).toContain("2 diary entries have"); });

  it("fires privacy_not_respected", () => { const a = identifyDailyDiaryAlerts([makeRecord({ privacy_respected: false })]); const p = a.find((x) => x.type === "privacy_not_respected"); expect(p).toBeDefined(); expect(p!.severity).toBe("high"); });

  it("no_feelings_explored not for 1", () => { const a = identifyDailyDiaryAlerts([makeRecord({ feelings_explored: false })]); expect(a.find((x) => x.type === "no_feelings_explored")).toBeUndefined(); });

  it("no_feelings_explored fires for 2", () => { const a = identifyDailyDiaryAlerts([makeRecord({ id: "f-1", feelings_explored: false }), makeRecord({ id: "f-2", feelings_explored: false })]); const f = a.find((x) => x.type === "no_feelings_explored"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });

  it("keyworker_not_read not for 1", () => { const a = identifyDailyDiaryAlerts([makeRecord({ keyworker_read: false })]); expect(a.find((x) => x.type === "keyworker_not_read")).toBeUndefined(); });

  it("keyworker_not_read fires for 2", () => { const a = identifyDailyDiaryAlerts([makeRecord({ id: "k-1", keyworker_read: false }), makeRecord({ id: "k-2", keyworker_read: false })]); const k = a.find((x) => x.type === "keyworker_not_read"); expect(k).toBeDefined(); expect(k!.severity).toBe("medium"); });

  it("fires all applicable", () => { 
    const rec = makeRecord({ entry_type: "concern_raised", concerns_addressed: false, responded_to: false, privacy_respected: false, feelings_explored: false, keyworker_read: false });
    const a = identifyDailyDiaryAlerts([rec, { ...rec, id: "a-2" }]);
    const types = a.map((x) => x.type);
    expect(types).toContain("concern_not_addressed");
    expect(types).toContain("not_responded_to");
    expect(types).toContain("privacy_not_respected");
    expect(types).toContain("no_feelings_explored");
    expect(types).toContain("keyworker_not_read");
  });
});
