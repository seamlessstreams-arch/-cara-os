import { describe, it, expect } from "vitest";
import { draftRiskThemes } from "../profile-autodraft";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — learning-profile auto-draft: risk-theme derivation
//
// The one piece of custom deterministic logic (the rest is dal wiring + the
// emotional-safety engine, both covered elsewhere / live). Locks: word-boundary
// matching (no substring false positives), frequency ordering, and honest-empty.
// ══════════════════════════════════════════════════════════════════════════════

describe("draftRiskThemes", () => {
  it("maps incident type + description to the curriculum risk-theme vocabulary", () => {
    const themes = draftRiskThemes([
      { type: "missing_from_care", description: "Left after the phone call, returned at 2am" },
      { type: "physical_assault", description: "Punched another resident" },
      { type: "substance_use", description: "Found vaping in the garden" },
    ]);
    expect(themes).toContain("missing");
    expect(themes).toContain("violence");
    expect(themes).toContain("substance");
  });

  it("orders themes by frequency, most frequent first", () => {
    const themes = draftRiskThemes([
      { type: "missing_from_care", description: "absconded from school" },
      { type: "missing_from_care", description: "went missing overnight" },
      { type: "altercation", description: "aggressive towards staff" },
    ]);
    expect(themes[0]).toBe("missing");
  });

  it("does not false-match a keyword inside an unrelated word (word-boundary)", () => {
    // "commissioning" contains the substring "missi…" but must NOT imply "missing".
    const themes = draftRiskThemes([
      { type: "meeting", description: "Attended a commissioning review about the placement" },
    ]);
    expect(themes).not.toContain("missing");
    expect(themes).toEqual([]);
  });

  it("returns an empty list when nothing matches (never fabricates a theme)", () => {
    expect(draftRiskThemes([])).toEqual([]);
    expect(draftRiskThemes([{ type: "note", description: "A calm, settled afternoon baking." }])).toEqual([]);
  });
});
