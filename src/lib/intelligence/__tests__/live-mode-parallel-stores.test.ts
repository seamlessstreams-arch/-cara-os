import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { CaraAuditEntry } from "@/types/extended";

// Same discipline as src/lib/db/__tests__/live-mode-seed-gate.test.ts: the
// gates run at module load, so every case sets the env BEFORE importing and
// resets the module registry between modes. Re-importing seeded modules is slow
// under a loaded runner; the 5s default budget is a false red.
vi.setConfig({ testTimeout: 30_000 });

// These are the PARALLEL stores — the main store's gate never touches them.
// Before their own gates landed, a live tenant's complaints, contact-persons,
// interventions, voice records and the reg44/45 evidence screens served seeded
// demo fiction as if it were the home's own records.
//
// Every seeded row in the intelligence store carries home_id "home_oak", and
// its findAll(homeId) wrappers FILTER by it — so the demo-mode assertions below
// use that id deliberately. Asserting through a bare findAll() would return []
// in BOTH modes (nothing matches home_id undefined) and the live-mode check
// would pass vacuously: a false-green about the exact thing being tested.
const SEEDED_HOME = "home_oak";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

async function intelligenceWithMode(mode: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_CARA_MODE", mode ?? "");
  return await import("@/lib/intelligence/store");
}

async function fallbackWithMode(mode: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_CARA_MODE", mode ?? "");
  return await import("@/lib/intelligence/fallback-store");
}

describe("demo mode (the default) is untouched", () => {
  it("intelligence store still seeds when the mode is unset", async () => {
    const m = await intelligenceWithMode(undefined);
    // caraAssessments / caraSafeguardingFlags / caraRecommendations carry demo
    // seeds; caraAuditTrail and caraOversight are runtime-accumulation
    // collections that start empty by design, so they are NOT seed assertions.
    expect(m.intelligenceDb.caraAssessments.findAll(SEEDED_HOME).length).toBeGreaterThan(0);
    expect(m.intelligenceDb.caraSafeguardingFlags.findAll(SEEDED_HOME).length).toBeGreaterThan(0);
    expect(m.intelligenceDb.caraRecommendations.findAll(SEEDED_HOME).length).toBeGreaterThan(0);
  });

  it("fallback store still seeds when the mode is unset", async () => {
    const m = await fallbackWithMode(undefined);
    expect(m.reg44Visits.length).toBeGreaterThan(0);
    expect(m.voiceEntries.length).toBeGreaterThan(0);
    expect(m.staffPassportRecords.length).toBeGreaterThan(0);
  });

  it("treats anything that is not exactly 'live' as the demo — the safe default", async () => {
    for (const mode of ["demo", "LIVE", "live ", "production", "1"]) {
      vi.resetModules();
      const m = await fallbackWithMode(mode);
      expect(m.reg44Visits.length, `mode=${JSON.stringify(mode)} must stay seeded`).toBeGreaterThan(0);
    }
  });
});

describe("a live tenant starts empty", () => {
  it("clears the intelligence store — checked against the id the seeds actually use", async () => {
    const m = await intelligenceWithMode("live");
    // The same three calls that return >0 rows in the demo case above return 0
    // here — non-vacuous by construction.
    expect(m.intelligenceDb.caraAssessments.findAll(SEEDED_HOME)).toEqual([]);
    expect(m.intelligenceDb.caraSafeguardingFlags.findAll(SEEDED_HOME)).toEqual([]);
    expect(m.intelligenceDb.caraRecommendations.findAll(SEEDED_HOME)).toEqual([]);
  });

  it("clears every exported array on the fallback store — the whole module, not a sample", async () => {
    const m = await fallbackWithMode("live");
    for (const [name, value] of Object.entries(m)) {
      if (!Array.isArray(value)) continue; // hrInspectionWorkforce (documented residual) + helpers
      expect(value.length, `fallback-store.${name} leaked seeds into live mode`).toBe(0);
    }
  });

  it("runtime writes still work after the gate — live homes create their own records", async () => {
    const m = await intelligenceWithMode("live");
    expect(m.intelligenceDb.caraAuditTrail.findAll(SEEDED_HOME)).toEqual([]);
    const entry: Omit<CaraAuditEntry, "id" | "created_at"> = {
      home_id: SEEDED_HOME,
      user_id: "staff_test",
      action_type: "ai_generation" as CaraAuditEntry["action_type"],
      human_edit: "live write survives the gate",
    };
    m.intelligenceDb.caraAuditTrail.create(entry);
    expect(m.intelligenceDb.caraAuditTrail.findAll(SEEDED_HOME).length).toBe(1);
  });
});
