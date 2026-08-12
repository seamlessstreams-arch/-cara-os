import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelative } from "@/lib/utils";

// formatRelative used a rolling 24-hour diff: Math.round((d - now) / 86400000).
// A date-only string parses as UTC midnight — 01:00 during BST — so from about
// 12:30 every summer afternoon the rounded diff hit -1 and a task due TODAY
// read "Yesterday", while one due tomorrow read "Today" all evening. It is
// used on 41 surfaces: task due dates, "last key working", welfare rounds —
// "last key working: Yesterday" when it was this morning misleads oversight.
// The fixtures below are the exact instants reproduced before the fix.
describe("formatRelative — calendar days in London, not a rolling 24h window", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const at = (iso: string) => vi.setSystemTime(new Date(iso));

  it('a task due today is "Today" at 4pm — the old code said "Yesterday"', () => {
    at("2026-08-13T16:00:00+01:00");
    expect(formatRelative("2026-08-13")).toBe("Today");
  });

  it('…and still "Today" at 13:31, just past the old rounding cliff', () => {
    at("2026-08-13T13:31:00+01:00");
    expect(formatRelative("2026-08-13")).toBe("Today");
  });

  it('a task due tomorrow is "Tomorrow" at 10pm — the old code said "Today"', () => {
    at("2026-08-13T22:00:00+01:00");
    expect(formatRelative("2026-08-14")).toBe("Tomorrow");
  });

  it("inside the BST midnight window, a record dated the London day is Today", () => {
    // 00:30 London on the 14th is 23:30Z on the 13th — the classic window.
    at("2026-08-13T23:30:00Z");
    expect(formatRelative("2026-08-14")).toBe("Today");
    expect(formatRelative("2026-08-13")).toBe("Yesterday");
  });

  it("winter (GMT) behaves identically", () => {
    at("2026-01-15T16:00:00Z");
    expect(formatRelative("2026-01-15")).toBe("Today");
    expect(formatRelative("2026-01-16")).toBe("Tomorrow");
    expect(formatRelative("2026-01-13")).toBe("2 days ago");
  });

  it("keeps the branch vocabulary for wider gaps", () => {
    at("2026-08-13T16:00:00+01:00");
    expect(formatRelative("2026-08-16")).toBe("In 3 days");
    expect(formatRelative("2026-08-10")).toBe("3 days ago");
    expect(formatRelative("2026-09-13")).toBe("13 Sept 2026");
  });

  it("returns junk strings as-is instead of 'Invalid Date'", () => {
    at("2026-08-13T16:00:00+01:00");
    expect(formatRelative("not-a-date")).toBe("not-a-date");
    expect(formatRelative("")).toBe("");
    expect(formatRelative(null)).toBe("");
  });
});
