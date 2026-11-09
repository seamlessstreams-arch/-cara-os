import { describe, it, expect } from "vitest";
import {
  CHILD_POV_OPENERS,
  getOpenersByTheme,
  listScenarioThemes,
} from "../training-scenarios";

describe("child-POV training scenario openers", () => {
  it("ships a set of fictional openers", () => {
    expect(CHILD_POV_OPENERS.length).toBeGreaterThanOrEqual(5);
    expect(CHILD_POV_OPENERS.every((o) => o.fictional === true)).toBe(true);
  });

  it("every opener is written in the first person (child's point of view)", () => {
    for (const o of CHILD_POV_OPENERS) {
      expect(/\b(i|i'm|me|my)\b/i.test(o.opener), o.id).toBe(true);
    }
  });

  it("every opener carries a reflective staff prompt", () => {
    for (const o of CHILD_POV_OPENERS) {
      expect(o.staffPrompt.trim().length, o.id).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = CHILD_POV_OPENERS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getOpenersByTheme filters by theme", () => {
    const t = getOpenersByTheme("transitions");
    expect(t.length).toBeGreaterThan(0);
    expect(t.every((o) => o.theme === "transitions")).toBe(true);
  });

  it("listScenarioThemes returns the distinct themes present", () => {
    const themes = listScenarioThemes();
    expect(themes.length).toBe(new Set(themes).size);
    expect(themes).toContain("transitions");
  });
});
