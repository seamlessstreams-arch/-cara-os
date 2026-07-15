import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Each case re-imports the store (20,537 lines) because the gate runs at module
// load and vi.resetModules() must clear it between modes. That is genuinely slow
// under a loaded CI runner — the default 5s budget times out on the first case,
// which is a false red, not a real failure.
vi.setConfig({ testTimeout: 30_000 });

// The seed gate is the line between the demo and a real children's home.
//
// Getting it wrong in the safe direction costs a blank demo. Getting it wrong in
// the unsafe direction puts Chamberlain House's seeded children on screen inside
// a live home, where nobody can tell them from real ones. So these tests assert
// the WHOLE store is clear, not a hopeful sample of it.
//
// The gate runs at module load, so every case must set the env BEFORE importing
// the store, and reset the module registry between cases.

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

async function storeWithMode(mode: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_CARA_MODE", mode ?? "");
  const { getStore } = await import("@/lib/db/store");
  return getStore();
}

describe("demo mode (the default) is untouched", () => {
  it("still seeds when NEXT_PUBLIC_CARA_MODE is unset", async () => {
    const s = await storeWithMode(undefined);
    expect(s.youngPeople.length).toBeGreaterThan(0);
    expect(s.staff.length).toBeGreaterThan(0);
    expect(s.home.name).toBe("Chamberlain House");
  });

  it("treats anything that is not exactly 'live' as the demo — the safe default", async () => {
    for (const mode of ["demo", "LIVE", "live ", "production", "1"]) {
      vi.resetModules();
      const s = await storeWithMode(mode);
      expect(s.youngPeople.length, `mode=${JSON.stringify(mode)} must stay seeded`).toBeGreaterThan(0);
    }
  });
});

describe("a live tenant starts empty", () => {
  it("has no children, staff or incidents", async () => {
    const s = await storeWithMode("live");
    expect(s.youngPeople).toHaveLength(0);
    expect(s.staff).toHaveLength(0);
    expect(s.incidents).toHaveLength(0);
  });

  it("carries no seeded home identity — a live home is unprovisioned until created", async () => {
    const s = await storeWithMode("live");
    expect(s.home.name).toBe("");
    expect(s.home.id).toBe("");
    expect(s.home.ofsted_urn).toBeNull();
    // The seeded home must not survive in any recognisable form.
    expect(JSON.stringify(s.home)).not.toContain("Chamberlain");
    expect(JSON.stringify(s.home)).not.toContain("home_oak");
  });

  it("leaves NO seeded array anywhere on the store", async () => {
    const s = await storeWithMode("live");
    const survivors = Object.entries(s)
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([k, v]) => `${k}(${(v as unknown[]).length})`);
    // Names the offenders rather than just failing a count — a new seeded
    // collection added to the store shows up here by name.
    expect(survivors).toEqual([]);
  });

  it("empties collections in place so import-time references see it", async () => {
    // Several modules capture `store.x` at import. Reassigning instead of
    // mutating would leave those pointing at the seeded array.
    vi.stubEnv("NEXT_PUBLIC_CARA_MODE", "live");
    const mod = await import("@/lib/db/store");
    const captured = mod.getStore().youngPeople;
    expect(captured).toHaveLength(0);
    expect(captured).toBe(mod.getStore().youngPeople);
  });
});
