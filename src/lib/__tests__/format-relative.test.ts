import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelative, londonDayDiff } from "@/lib/utils";

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

// londonDayDiff is the shared basis for every "Today"/"Yesterday" label. Four
// surfaces had hand-rolled the rolling-window version of this and each was
// wrong in its own way: a risk card called a log written yesterday evening
// "Today" until the same hour tonight (Math.floor of now-then); the timeline
// grouped by the RUNTIME zone's calendar (UTC in SSR); two "Yesterday" filters
// took the UTC slice of a local subtraction. All four now call this.
describe("londonDayDiff — signed London calendar days from today", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const at = (iso: string) => vi.setSystemTime(new Date(iso));

  it("a log written yesterday evening, read this morning, is -1 — not 0", () => {
    // 14 hours apart, but different London days: the risk-card repro.
    at("2026-08-13T10:00:00+01:00");
    expect(londonDayDiff("2026-08-12T20:00:00+01:00")).toBe(-1);
  });

  it("a timestamp from earlier the same London day is 0 across a >24h-free window", () => {
    at("2026-08-13T23:30:00+01:00");
    expect(londonDayDiff("2026-08-13T00:15:00+01:00")).toBe(0);
  });

  it("inside the BST midnight window the London day wins over the UTC day", () => {
    // 00:30 London on the 14th = 23:30Z on the 13th.
    at("2026-08-13T23:30:00Z");
    expect(londonDayDiff("2026-08-14")).toBe(0);
    expect(londonDayDiff("2026-08-13")).toBe(-1);
    expect(londonDayDiff("2026-08-15")).toBe(1);
  });

  it("spans the spring clock change without drifting", () => {
    // 2026-03-29 is the BST switch: the 23-hour day must still count as 1.
    at("2026-03-30T12:00:00+01:00");
    expect(londonDayDiff("2026-03-28T12:00:00Z")).toBe(-2);
    expect(londonDayDiff("2026-03-29T12:00:00+01:00")).toBe(-1);
  });

  it("is NaN for junk", () => {
    at("2026-08-13T16:00:00+01:00");
    expect(londonDayDiff("not-a-date")).toBeNaN();
  });
});
