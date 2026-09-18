// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — a LIVE tenant never receives a demo fixture
//
// THE INCIDENT (18 Sep 2026): the Practice Intelligence page was rewired to
// fetch /api/practice-intelligence/scanner on mount. On a live tenant with no
// Supabase keys the service fell back to getDemoScan(), which names demo
// children — so a real home's manager would have been shown invented children
// ("Jayden", "Amara") presented as its own. The nightly live-fiction crawl
// caught it on the first run after the merge.
//
// The fallbacks are correct in DEMO mode and wrong on a live tenant, so the
// guard lives in the services: without a database a live tenant gets nothing
// (null / [] / a thrown error), never a fixture. The `if (error)` variants are
// the same class one step worse — a real home whose query merely FAILED would
// have been shown fiction in place of its own records.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn(() => null) }));

import { getLatestScan, listScans, runPracticeIntelligenceScan } from "../scanner.service";
import { listLearningResources } from "../learning-studio.service";
import { listOversightDrafts } from "../oversight-intelligence.service";
import { listTherapeuticProfiles } from "../therapeutic-profile.service";

const ORIG = process.env.NEXT_PUBLIC_CARA_MODE;
const live = () => { process.env.NEXT_PUBLIC_CARA_MODE = "live"; };
afterEach(() => {
  if (ORIG === undefined) delete process.env.NEXT_PUBLIC_CARA_MODE;
  else process.env.NEXT_PUBLIC_CARA_MODE = ORIG;
});

/** The demo fixtures' distinctive names — the live-fiction crawl's token list. */
const FICTION = ["Jayden", "Amara", "Chamberlain", "Alex T", "Casey L"];
const fictionIn = (v: unknown) => {
  const s = JSON.stringify(v ?? "");
  return FICTION.filter((f) => s.includes(f));
};

describe("live tenant with no database", () => {
  it("getLatestScan returns null, not a demo scan", async () => {
    live();
    expect(await getLatestScan()).toBeNull();
  });

  it("listScans returns an empty list, not a demo scan", async () => {
    live();
    expect(await listScans()).toEqual([]);
  });

  it("runPracticeIntelligenceScan refuses honestly rather than inventing a scan", async () => {
    live();
    await expect(runPracticeIntelligenceScan()).rejects.toThrow(/database/i);
  });

  it("no practice-intelligence list hands back demo children", async () => {
    live();
    for (const result of [
      await getLatestScan(),
      await listScans(),
      await listLearningResources(),
      await listOversightDrafts(),
      await listTherapeuticProfiles(),
    ]) {
      expect(fictionIn(result)).toEqual([]);
    }
  });
});

describe("demo mode is unchanged", () => {
  it("still serves the demo scan when the mode is not live", async () => {
    delete process.env.NEXT_PUBLIC_CARA_MODE;
    const scan = await getLatestScan();
    expect(scan).not.toBeNull();
    expect(scan!.child_summaries.length).toBeGreaterThan(0);
  });
});
