import { describe, expect, it } from "vitest";
import {
  SAFETY_PLANNING_DEFINITION,
  SAFETY_PLAN_PRINCIPLES,
  TYPOLOGIES_OF_SAFETY,
  TRAUMA_STRESS_RESPONSES,
  SAFETY_PLAN_COMPONENTS,
  STRATEGIC_REFUSALS,
  SAFETY_TECH_TOOLS,
  DIRECT_WORK_ACTIVITIES,
  SAFETY_PLANNING_GUIDANCE_BLOCK,
  WORTHY_OF_SAFETY_PRINCIPLE,
  safetyTypologyNames,
  safetyTypologyPrompts,
  safetyPlanComponentPrompts,
  suggestSafetyPlanComponents,
} from "../safety-planning";

describe("safety-planning — structured data is complete & faithful", () => {
  it("has the four typologies of safety", () => {
    expect(TYPOLOGIES_OF_SAFETY).toHaveLength(4);
    expect(safetyTypologyNames()).toEqual(
      expect.arrayContaining(["Physical safety", "Emotional safety", "Financial safety", "Community safety"]),
    );
    for (const t of TYPOLOGIES_OF_SAFETY) {
      expect(t.definition).toBeTruthy();
      expect(t.prompt).toBeTruthy();
    }
  });

  it("has the eight qualities of a good safety plan, including co-designed and reviewed regularly", () => {
    expect(SAFETY_PLAN_PRINCIPLES).toHaveLength(8);
    expect(SAFETY_PLAN_PRINCIPLES.join(" ").toLowerCase()).toContain("co-designed");
    expect(SAFETY_PLAN_PRINCIPLES.join(" ").toLowerCase()).toContain("reviewed regularly");
  });

  it("encodes the five trauma stress responses (5 Fs)", () => {
    expect(TRAUMA_STRESS_RESPONSES.map((r) => r.key)).toEqual(["fight", "flight", "freeze", "flop", "fawn"]);
  });

  it("has plan components including a code word and strategic refusals", () => {
    const keys = SAFETY_PLAN_COMPONENTS.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(["code_word", "refusals_excuses", "safe_places", "trusted_adults"]));
    expect(STRATEGIC_REFUSALS.length).toBeGreaterThan(0);
    expect(safetyPlanComponentPrompts().length).toBe(SAFETY_PLAN_COMPONENTS.length);
    expect(safetyTypologyPrompts()).toHaveLength(4);
  });

  it("has tech tools and direct-work activities (body scanning, TFBSB, eco-mapping)", () => {
    expect(SAFETY_TECH_TOOLS.map((t) => t.name.toLowerCase()).join(" ")).toContain("what3words");
    expect(DIRECT_WORK_ACTIVITIES.map((a) => a.key)).toEqual(
      expect.arrayContaining(["body_scanning", "tfbsb", "eco_mapping", "place_space_mapping"]),
    );
  });

  it("the guidance block centres co-creation (with, not done to) and the trauma lens", () => {
    const block = SAFETY_PLANNING_GUIDANCE_BLOCK;
    expect(block).toContain("co-created WITH");
    expect(block).toContain("not done TO");
    expect(block.toLowerCase()).toContain("typologies of safety");
    expect(SAFETY_PLANNING_DEFINITION).toContain("not a form");
    expect(WORTHY_OF_SAFETY_PRINCIPLE.toLowerCase()).toContain("worthy of safety");
  });
});

describe("safety-planning — deterministic component suggestion", () => {
  it("suggests online + regulation components for an online context, and nothing for no context", () => {
    const online = suggestSafetyPlanComponents(["online_spaces"]);
    const areas = new Set(online.map((c) => c.area));
    expect(areas.has("online")).toBe(true);
    expect(areas.has("regulation")).toBe(true); // regulation always relevant under risk
    expect(suggestSafetyPlanComponents([])).toEqual([]);
  });

  it("suggests navigation + readiness for neighbourhood/transport contexts", () => {
    const out = suggestSafetyPlanComponents(["neighbourhood", "public_transport"]);
    const areas = new Set(out.map((c) => c.area));
    expect(areas.has("navigation")).toBe(true);
    expect(areas.has("readiness")).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  it("an exploitation context surfaces a broad set including communication and network", () => {
    const out = suggestSafetyPlanComponents(["exploitation"]);
    const areas = new Set(out.map((c) => c.area));
    expect(areas.has("communication")).toBe(true);
    expect(areas.has("network")).toBe(true);
  });
});
