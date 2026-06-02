import { describe, it, expect, afterEach } from "vitest";
import { HOMES, getHomeById, getActiveHomes, getCurrentHome, setCurrentHome } from "../home-registry";

describe("Home Registry", () => {
  afterEach(() => setCurrentHome("home_oak")); // restore default

  it("contains the three demo homes", () => {
    expect(HOMES).toHaveLength(3);
    expect(HOMES.map((h) => h.id)).toEqual(["home_oak", "home_willow", "home_cedar"]);
  });

  it("each home has the required fields", () => {
    for (const h of HOMES) {
      expect(h.id).toBeTruthy();
      expect(h.name).toBeTruthy();
      expect(h.ofsted_urn).toMatch(/^SC/);
      expect(h.capacity).toBeGreaterThan(0);
      expect(h.current_occupancy).toBeLessThanOrEqual(h.capacity);
      expect(["outstanding", "good", "adequate", "inadequate", null]).toContain(h.last_inspection_rating);
    }
  });

  it("getHomeById returns the matching home", () => {
    expect(getHomeById("home_willow")?.name).toBe("Willow Lodge");
    expect(getHomeById("home_cedar")?.registered_manager).toBe("Tom Hennessey");
  });

  it("getHomeById returns undefined for unknown id", () => {
    expect(getHomeById("home_nope")).toBeUndefined();
  });

  it("getActiveHomes returns only active homes", () => {
    const active = getActiveHomes();
    expect(active.length).toBe(3);
    expect(active.every((h) => h.status === "active")).toBe(true);
  });

  it("getCurrentHome defaults to Oak House", () => {
    expect(getCurrentHome().id).toBe("home_oak");
  });

  it("setCurrentHome switches the active home", () => {
    setCurrentHome("home_cedar");
    expect(getCurrentHome().id).toBe("home_cedar");
    expect(getCurrentHome().name).toBe("Cedar Court");
  });

  it("setCurrentHome throws on an unknown id (validates input)", () => {
    expect(() => setCurrentHome("nonexistent")).toThrow(/not found/i);
  });

  it("getCurrentHome always resolves to a valid home object", () => {
    // Defensive: even after a failed switch, the current home stays valid.
    try { setCurrentHome("nonexistent"); } catch { /* expected */ }
    expect(getCurrentHome()).toBeDefined();
    expect(getCurrentHome().id).toBeTruthy();
    expect(HOMES.some((h) => h.id === getCurrentHome().id)).toBe(true);
  });
});
