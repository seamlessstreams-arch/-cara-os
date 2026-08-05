import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/shift-summary/route";

// Regression guard: the shift summary's "Missing from care" section read a
// phantom field (`missingFromCareEpisodes`) that never existed on the store, so
// it was ALWAYS empty even on days with real missing-from-care episodes. It now
// reads the real `missingEpisodes` collection via dal. Seed `mfc_001`
// (yp_alex, date_missing 2026-01-15) must surface on its date, and a date with
// no episode must report none (no over-matching).
describe("shift-summary route — missing from care", () => {
  it("surfaces a seeded missing episode on its date", async () => {
    const req = new NextRequest(
      "http://localhost/api/v1/shift-summary?date=2026-01-15",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.stats.missing_episodes).toBeGreaterThan(0);
    const missing = body.data.events.filter(
      (e: { type: string }) => e.type === "missing",
    );
    expect(missing.length).toBeGreaterThan(0);
    expect(missing[0].title).toContain("Missing from care");
    expect(missing[0].child_id).toBe("yp_alex");
  });

  it("reports no missing episodes on a date with none", async () => {
    const req = new NextRequest(
      "http://localhost/api/v1/shift-summary?date=2099-12-31",
    );
    const res = await GET(req);
    const body = await res.json();
    expect(body.data.stats.missing_episodes).toBe(0);
  });
});
