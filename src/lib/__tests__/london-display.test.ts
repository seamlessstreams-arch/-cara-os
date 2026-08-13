import { describe, it, expect } from "vitest";
import { londonDisplay, londonHour, londonTimeStr, londonWeekday, londonWeekStart, addWorkingDays } from "@/lib/utils";

// The display-layer sibling of todayStr(). Client pages rendered "today" via
// bare toLocaleDateString, which uses the RUNTIME zone — London in the browser
// but UTC in SSR/prerender — so between 00:00 and 00:59 BST the server and
// client disagreed on the date (hydration mismatch, header flashing
// yesterday), and the visible "today" could differ from the todayStr() value
// the form persisted. londonDisplay pins the zone; these fixtures are the
// exact BST midnight window that used to split.
describe("londonDisplay", () => {
  const insideBstWindow = new Date("2026-07-15T23:30:00Z"); // 00:30 London, 16 July
  const winter = new Date("2026-01-15T23:30:00Z"); // 23:30 London, 15 Jan (GMT)

  it("shows the London day inside the BST midnight window, not the UTC day", () => {
    expect(londonDisplay({ weekday: "long", day: "numeric", month: "long" }, insideBstWindow)).toBe(
      "Thursday 16 July",
    );
  });

  it("agrees with UTC in winter, when London IS GMT", () => {
    expect(londonDisplay({ day: "numeric", month: "long", year: "numeric" }, winter)).toBe(
      "15 January 2026",
    );
  });

  it("pins times too — a 23:30Z summer instant is 00:30 in London", () => {
    expect(londonDisplay({ hour: "2-digit", minute: "2-digit" }, insideBstWindow)).toBe("00:30");
  });

  it("is independent of the process zone, which is what kills the hydration split", () => {
    // The suite runs under one TZ, but the formatter must not care: the same
    // instant yields the same string wherever it renders.
    const a = londonDisplay({ weekday: "long", day: "numeric", month: "long" }, insideBstWindow);
    expect(a).toBe("Thursday 16 July");
  });
});

// getHours() is the runtime zone — UTC on Vercel — so a 22:00 London incident
// bucketed as 21:00 all summer, shift-safety called the 22:00–22:59 waking-
// night hour "evening", and welfare/visitor records persisted the wrong time
// when filed from abroad. These pin the hour to London.
describe("londonHour / londonTimeStr", () => {
  it("a 21:30Z summer instant is hour 22 in London (getHours said 21 on Vercel)", () => {
    expect(londonHour(new Date("2026-08-13T21:30:00Z"))).toBe(22);
  });

  it("agrees with UTC in winter", () => {
    expect(londonHour(new Date("2026-01-15T21:30:00Z"))).toBe(21);
  });

  it("midnight is hour 0, never 24 — the hourCycle trap", () => {
    // 23:00Z in summer = 00:00 London. hour12:false renders "24" in some ICU
    // builds; hourCycle "h23" must hold this at 0 / "00:00".
    const midnight = new Date("2026-08-13T23:00:00Z");
    expect(londonHour(midnight)).toBe(0);
    expect(londonTimeStr(midnight)).toBe("00:00");
  });

  it("formats a persisted record time as London HH:MM", () => {
    expect(londonTimeStr(new Date("2026-08-13T08:05:00+01:00"))).toBe("08:05");
  });
});

// getDay() is the runtime zone: a 23:30Z Thursday in summer is London FRIDAY
// (weekday histograms misbucketed the night hour on Vercel), and a date-only
// string read in a New York browser reported the previous weekday all day —
// which is how the rota loaded last week and working-day deadlines drifted.
describe("londonWeekday / londonWeekStart / addWorkingDays", () => {
  it("a date-only string is its own weekday in every zone", () => {
    expect(londonWeekday("2026-08-14")).toBe(5); // Friday
    expect(londonWeekday("2026-08-16")).toBe(0); // Sunday
  });

  it("an instant in the BST night window belongs to the London day", () => {
    // 23:30Z Thursday 13th = 00:30 Friday in London.
    expect(londonWeekday(new Date("2026-08-13T23:30:00Z"))).toBe(5);
  });

  it("winter instants agree with UTC", () => {
    expect(londonWeekday(new Date("2026-01-15T23:30:00Z"))).toBe(4); // Thursday
  });

  it("is NaN for junk", () => {
    expect(londonWeekday("not-a-date")).toBeNaN();
  });

  it("finds Monday of the London week, with offsets", () => {
    const thu = new Date("2026-08-13T16:00:00+01:00");
    expect(londonWeekStart(0, thu)).toBe("2026-08-10");
    expect(londonWeekStart(-1, thu)).toBe("2026-08-03");
    expect(londonWeekStart(1, thu)).toBe("2026-08-17");
  });

  it("a Sunday belongs to the week that STARTED the previous Monday", () => {
    expect(londonWeekStart(0, new Date("2026-08-16T12:00:00+01:00"))).toBe("2026-08-10");
  });

  it("the first hour of a London Monday is already the new week", () => {
    // 23:30Z Sunday 16th = 00:30 Monday 17th in London. Local getDay + a UTC
    // slice put this hour in the PREVIOUS week — the rota bug.
    expect(londonWeekStart(0, new Date("2026-08-16T23:30:00Z"))).toBe("2026-08-17");
  });

  it("adds working days skipping weekends, in any zone", () => {
    expect(addWorkingDays("2026-08-14", 1)).toBe("2026-08-17"); // Fri +1 = Mon
    expect(addWorkingDays("2026-08-10", 5)).toBe("2026-08-17"); // Mon +5 = next Mon
    expect(addWorkingDays("2026-08-11", 2)).toBe("2026-08-13"); // Tue +2 = Thu
  });
});
