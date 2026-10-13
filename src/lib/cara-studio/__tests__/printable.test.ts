import { describe, expect, it } from "vitest";
import { extractHandout, staffSheetOf } from "../printable";

const material = {
  materialType: "scenario_cards", title: "Trust — scenario cards for Alex", childFriendlyIntro: "This is for you.",
  blocks: [{ heading: "Card 1", body: "A friend asks you to keep a secret.", childPrompt: "What would you do?", options: ["Tell", "Wait"] }, { heading: "Card 2", body: "Someone is pushy." }],
  printableText: "CARD 1\n...", audioScript: null, visualPrompt: "cards", lowWritingAlternative: "Point or draw.",
  staffGuidance: "Follow their pace.", safeguardingNotes: "Pause if concerned.", signsToPause: ["flat"], managerReviewNeeded: false,
};

describe("extractHandout", () => {
  it("takes the piece of work from a material and marks it for the child", () => {
    const h = extractHandout(material)!;
    expect(h.title).toBe("Trust — scenario cards for Alex");
    expect(h.audience).toBe("child");
    expect(h.blocks).toHaveLength(2);
    expect(h.blocks[0]).toEqual({ heading: "Card 1", body: "A friend asks you to keep a secret.", childPrompt: "What would you do?", options: ["Tell", "Wait"] });
    expect(h.blocks[1]).toEqual({ heading: "Card 2", body: "Someone is pushy." });
  });
  it("takes it from a session plan's producedMaterial", () => {
    const { staffGuidance: _s, safeguardingNotes: _n, signsToPause: _p, managerReviewNeeded: _m, ...m } = material;
    void [_s, _n, _p, _m];
    expect(extractHandout({ title: "Session", mainActivity: "x", producedMaterial: m })?.title).toBe(material.title);
  });
  it("a script for the adult is not marked for the child", () => {
    expect(extractHandout({ ...material, materialType: "staff_script" })?.audience).toBe("staff");
  });
  it("returns null when there is no piece of work", () => {
    expect(extractHandout(null)).toBeNull();
    expect(extractHandout({ title: "Debrief", questions: ["a"] })).toBeNull();
    expect(extractHandout({ ...material, blocks: [] })).toBeNull();
    expect(extractHandout({ ...material, blocks: [{ heading: "", body: "x" }, 5, null] })).toBeNull();
    expect(extractHandout({ producedMaterial: "nope" })).toBeNull();
  });
});

describe("staffSheetOf", () => {
  it("removes the piece of work from a material and keeps every staff note", () => {
    const s = staffSheetOf(material);
    for (const k of ["blocks", "printableText", "childFriendlyIntro", "lowWritingAlternative", "title", "materialType"]) expect(s, k).not.toHaveProperty(k);
    expect(s).toMatchObject({ staffGuidance: "Follow their pace.", safeguardingNotes: "Pause if concerned.", signsToPause: ["flat"], audioScript: null, visualPrompt: "cards" });
  });
  it("removes producedMaterial from a session plan and leaves the plan whole", () => {
    const plan = { title: "Session", mainActivity: "x", producedMaterial: material };
    expect(staffSheetOf(plan)).toEqual({ title: "Session", mainActivity: "x" });
  });
  it("leaves an output with no hand-out exactly as it was", () => {
    const o = { title: "Debrief", questions: ["a"] };
    expect(staffSheetOf(o)).toBe(o);
  });
  it("never puts staff-only notes in the hand-out", () => {
    const json = JSON.stringify(extractHandout(material));
    for (const s of ["Follow their pace", "Pause if concerned", "signsToPause", "staffGuidance"]) expect(json).not.toContain(s);
  });
});
