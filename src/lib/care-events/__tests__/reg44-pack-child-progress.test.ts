import { describe, it, expect } from "vitest";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";

describe("Reg 44 pack — whole-child progress evidence from the CPIE twin", () => {
  const pack = generateReg44Pack("home_oak");

  it("enriches each child snapshot with whole-child progress evidence", () => {
    expect(pack.children.length).toBeGreaterThan(0);
    const alex = pack.children.find((c) => c.child_id === "yp_alex");
    expect(alex?.progress).toBeTruthy();
    expect(alex!.progress!.who.toLowerCase()).toContain("football");
    expect(["improving", "stable", "declining", "not yet readable"]).toContain(alex!.progress!.directionOfTravel);
    expect(alex!.progress!.recentAchievements.length).toBeGreaterThan(0);
  });

  it("is evidence only — carries no opinion, QS status or safeguarding conclusion", () => {
    for (const c of pack.children) {
      const blob = JSON.stringify(c.progress ?? {}).toLowerCase();
      // The statutory verdicts stay the visitor's — never asserted here.
      expect(blob).not.toMatch(/effectively safeguarded|quality standard (met|not met)|meets the standard|opinion:/);
    }
  });

  it("still exposes the child as a person, not just risk flags (the CPIE point)", () => {
    const alex = pack.children.find((c) => c.child_id === "yp_alex")!;
    // Risk flags remain, but progress evidence now sits alongside them.
    expect(Array.isArray(alex.risk_flags)).toBe(true);
    expect(alex.progress!.recentAchievements.join(" ").length).toBeGreaterThan(0);
  });

  it("keeps working when a child has a sparse record (progress present, gaps honest)", () => {
    const casey = pack.children.find((c) => c.child_id === "yp_casey");
    if (casey) {
      expect(casey.progress).toBeTruthy();
      expect(Array.isArray(casey.progress!.missingInformation)).toBe(true);
    }
  });

  it("does not disturb the rest of the pack (headline + collections intact)", () => {
    expect(pack.headline.children_in_residence).toBe(pack.children.length);
    expect(Array.isArray(pack.incidents)).toBe(true);
    expect(pack.schema_version).toBe(1);
  });
});
