// ══════════════════════════════════════════════════════════════════════════════
// THE DASHBOARD MAY NOT INVENT A FIGURE
//
// Two demo constants survived into the live Command Centre:
//
//     on_shift:        onShift.length || 4
//     scheduled_today: scheduledToday || 6
//
// `||` does not mean "when there is no data". It means "when the value is
// falsy", and 0 is falsy — so these fired EXACTLY when the real answer was
// zero, which is the one answer that matters for both. Oak House, with no rota
// recorded for the day, was shown "4 Staff on shift now — ratio met", inches
// from a caption reading "Deterministic — every figure traces to a record,
// nothing invented."
//
// The same shape had already been found and removed once, in health-check:
// `training.length || 1` made an empty training register read as 100% current.
// These tests exist so the third one is caught by CI rather than by a manager
// trusting a number during an inspection.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-guard", () => ({
  getRequestIdentity: async () => ({ userId: "staff_x", role: "registered_manager", homeId: "h1" }),
}));

import { GET } from "../route";
import { getStore } from "@/lib/db/store";

const call = async () => {
  const res = await GET(new NextRequest(new Request("http://t/api/v1/dashboard")));
  return (await res.json()).data;
};

const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => {
  // An empty home: no rota, no medication rounds. The honest answer is zero.
  getStore().shifts.length = 0;
  getStore().medicationAdministrations.length = 0;
});

describe("staffing", () => {
  it("reports ZERO staff on shift when none are recorded", async () => {
    expect((await call()).staffing.on_shift).toBe(0);
  });

  it("never reports the demo constant 4", async () => {
    expect((await call()).staffing.on_shift).not.toBe(4);
  });

  it("counts real shifts when there are some", async () => {
    getStore().shifts.push(
      { id: "s1", date: today(), status: "confirmed", staff_id: "a" } as never,
      { id: "s2", date: today(), status: "in_progress", staff_id: "b" } as never,
    );
    expect((await call()).staffing.on_shift).toBe(2);
  });
});

describe("medication", () => {
  it("reports ZERO rounds scheduled when none are recorded", async () => {
    expect((await call()).medication.scheduled_today).toBe(0);
  });

  it("never reports the demo constant 6", async () => {
    expect((await call()).medication.scheduled_today).not.toBe(6);
  });
});

describe("the pattern, not just today's two instances", () => {
  it("no `|| <number>` fallback remains in the route", async () => {
    // The assertions above pin the two we found. This pins the SHAPE, which is
    // what recurs — someone adding a third would trip this rather than a home.
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/app/api/v1/dashboard/route.ts", "utf8");
    const offenders = src
      .split("\n")
      .filter((l) => /\|\|\s*[1-9][0-9]*\s*,/.test(l) && !l.trim().startsWith("//"));
    expect(offenders).toEqual([]);
  });
});
