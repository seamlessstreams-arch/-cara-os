import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The home-identity source is what ~180 screens will read instead of hardcoding
// "Chamberlain House". The property that matters: in live mode, before the home
// is provisioned, it must report NO identity — never a stale demo name that a
// screen would render as if it were real.

vi.setConfig({ testTimeout: 30_000 }); // re-imports the 20,537-line store per mode

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

async function homeGet(mode: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_CARA_MODE", mode ?? "");
  const { dal } = await import("@/lib/db/dal");
  return dal.home.get();
}

describe("dal.home.get()", () => {
  it("returns the seeded home in demo mode", async () => {
    const h = await homeGet(undefined);
    expect(h?.name).toBe("Chamberlain House");
    expect(h?.id).toBe("home_oak");
  });

  it("returns a blanked, identity-less home in live mode", async () => {
    const h = await homeGet("live");
    // Shaped like a Home so the ~8 store.home readers keep working, but carrying
    // nothing that could be mistaken for a real home.
    expect(h?.id).toBe("");
    expect(h?.name).toBe("");
    expect(JSON.stringify(h)).not.toContain("Chamberlain");
  });
});

// Mirrors the route's provisioned check so the contract is pinned in one place.
const isProvisioned = (h: { id: string; name: string } | null | undefined) =>
  Boolean(h && h.id && h.name);

describe("the route's provisioned flag", () => {
  it("is false for the live-mode blank home (⇒ client shows its own fallback)", async () => {
    expect(isProvisioned(await homeGet("live"))).toBe(false);
  });

  it("is true for the seeded demo home", async () => {
    expect(isProvisioned(await homeGet(undefined))).toBe(true);
  });
});
